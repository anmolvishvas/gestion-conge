<?php

namespace App\EventSubscriber;

use ApiPlatform\Symfony\EventListener\EventPriorities;
use App\Entity\LeaveBalance;
use App\Service\LeaveBalanceManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\ViewEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Psr\Log\LoggerInterface;

class LeaveBalanceSubscriber implements EventSubscriberInterface
{
    private EntityManagerInterface $entityManager;
    private LeaveBalanceManager $leaveBalanceManager;
    private LoggerInterface $logger;

    public function __construct(
        EntityManagerInterface $entityManager,
        LeaveBalanceManager $leaveBalanceManager,
        LoggerInterface $logger
    ) {
        $this->entityManager = $entityManager;
        $this->leaveBalanceManager = $leaveBalanceManager;
        $this->logger = $logger;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::VIEW => ['onLeaveBalanceWrite', EventPriorities::PRE_WRITE],
        ];
    }

    public function onLeaveBalanceWrite(ViewEvent $event): void
    {
        $leaveBalance = $event->getControllerResult();
        $method = $event->getRequest()->getMethod();

        if (!$leaveBalance instanceof LeaveBalance || !in_array($method, [Request::METHOD_PUT])) {
            return;
        }

        try {
            // Get the original entity from the database
            $originalEntity = $this->entityManager
                ->getRepository(LeaveBalance::class)
                ->find($leaveBalance->getId());

            if (!$originalEntity) {
                throw new \Exception('Original entity not found');
            }

            // Debug logging
            $this->logger->debug('Processing leave balance update:', [
                'id' => $originalEntity->getId(),
                'year' => $originalEntity->getYear(),
                'userId' => $originalEntity->getUser()->getId(),
                'oldCarryOver' => $originalEntity->getCarriedOverToNextYear(),
                'newCarryOver' => $leaveBalance->getCarriedOverToNextYear()
            ]);

            // Preserve original values
            $leaveBalance->setYear($originalEntity->getYear());
            $leaveBalance->setInitialPaidLeave($originalEntity->getInitialPaidLeave());
            $leaveBalance->setInitialSickLeave($originalEntity->getInitialSickLeave());
            $leaveBalance->setRemainingPaidLeave($originalEntity->getRemainingPaidLeave());
            $leaveBalance->setRemainingSickLeave($originalEntity->getRemainingSickLeave());
            $leaveBalance->setCarriedOverFromPreviousYear($originalEntity->getCarriedOverFromPreviousYear());

            // If carriedOverToNextYear has changed
            $newCarryOver = $leaveBalance->getCarriedOverToNextYear();
            $oldCarryOver = $originalEntity->getCarriedOverToNextYear();

            if ($newCarryOver !== $oldCarryOver) {
                $nextYear = $originalEntity->getYear() + 1;
                $userId = $originalEntity->getUser()->getId();

                // Use direct SQL to update the next year's balance
                $conn = $this->entityManager->getConnection();
                
                // First, find the next year's balance ID
                $nextYearBalanceQuery = "SELECT id, initial_paid_leave FROM leave_balance WHERE user_id = :userId AND year = :year";
                $nextYearBalance = $conn->executeQuery(
                    $nextYearBalanceQuery,
                    [
                        'userId' => $userId,
                        'year' => $nextYear
                    ]
                )->fetchAssociative();

                if ($nextYearBalance) {
                    $this->logger->debug('Found next year balance:', [
                        'id' => $nextYearBalance['id'],
                        'initialPaidLeave' => $nextYearBalance['initial_paid_leave']
                    ]);

                    // Calculate new remaining paid leave
                    $newRemaining = $nextYearBalance['initial_paid_leave'] + $newCarryOver;

                    // Update the next year's balance
                    $updateQuery = "
                        UPDATE leave_balance 
                        SET 
                            carried_over_from_previous_year = :carryOver,
                            remaining_paid_leave = :remaining
                        WHERE id = :id
                    ";

                    $result = $conn->executeStatement(
                        $updateQuery,
                        [
                            'carryOver' => $newCarryOver,
                            'remaining' => $newRemaining,
                            'id' => $nextYearBalance['id']
                        ]
                    );

                    $this->logger->debug('Updated next year balance:', [
                        'id' => $nextYearBalance['id'],
                        'newCarryOver' => $newCarryOver,
                        'newRemaining' => $newRemaining,
                        'updateResult' => $result
                    ]);

                    // Verify the update
                    $verifyQuery = "SELECT * FROM leave_balance WHERE id = :id";
                    $verifyBalance = $conn->executeQuery(
                        $verifyQuery,
                        ['id' => $nextYearBalance['id']]
                    )->fetchAssociative();

                    $this->logger->debug('Verified next year balance after update:', [
                        'id' => $verifyBalance['id'],
                        'carriedOver' => $verifyBalance['carried_over_from_previous_year'],
                        'remaining' => $verifyBalance['remaining_paid_leave']
                    ]);
                } else {
                    $this->logger->warning('No balance found for next year:', [
                        'year' => $nextYear,
                        'userId' => $userId
                    ]);
                }
            }
        } catch (\Exception $e) {
            $this->logger->error('Error in leave balance update:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
} 