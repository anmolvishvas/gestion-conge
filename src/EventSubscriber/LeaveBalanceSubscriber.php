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
                $conn = $this->entityManager->getConnection();
                $userId = $originalEntity->getUser()->getId();
                $currentYear = $originalEntity->getYear();

                // Find the current year's balance (2025)
                $currentYearBalanceQuery = "
                    SELECT id, initial_paid_leave, remaining_paid_leave, carried_over_from_previous_year 
                    FROM leave_balance 
                    WHERE user_id = :userId AND year = :year
                ";
                $currentYearBalance = $conn->executeQuery(
                    $currentYearBalanceQuery,
                    [
                        'userId' => $userId,
                        'year' => $currentYear
                    ]
                )->fetchAssociative();

                if ($currentYearBalance) {
                    $this->logger->debug('Found current year balance:', [
                        'id' => $currentYearBalance['id'],
                        'year' => $currentYear,
                        'currentCarryOver' => $currentYearBalance['carried_over_from_previous_year']
                    ]);

                    // Find the previous year's balance (2024)
                    $previousYear = $currentYear - 1;
                    $previousYearBalanceQuery = "
                        SELECT id, carried_over_to_next_year 
                        FROM leave_balance 
                        WHERE user_id = :userId AND year = :year
                    ";
                    $previousYearBalance = $conn->executeQuery(
                        $previousYearBalanceQuery,
                        [
                            'userId' => $userId,
                            'year' => $previousYear
                        ]
                    )->fetchAssociative();

                    if ($previousYearBalance) {
                        // Calculate the new remaining paid leave
                        $oldCarryOver = $currentYearBalance['carried_over_from_previous_year'];
                        $currentRemaining = $currentYearBalance['remaining_paid_leave'];
                        $initialPaidLeave = $currentYearBalance['initial_paid_leave'];
                        
                        // Update both current and previous year balances
                        $updateCurrentYearQuery = "
                            UPDATE leave_balance 
                            SET 
                                carried_over_from_previous_year = :carryOver
                            WHERE id = :id
                        ";

                        $updatePreviousYearQuery = "
                            UPDATE leave_balance 
                            SET carried_over_to_next_year = :carryOver
                            WHERE id = :id
                        ";

                        // Execute both updates in a transaction
                        $conn->beginTransaction();
                        try {
                            // Update current year (2025)
                            $conn->executeStatement(
                                $updateCurrentYearQuery,
                                [
                                    'carryOver' => $newCarryOver,
                                    'id' => $currentYearBalance['id']
                                ]
                            );

                            // Update previous year (2024)
                            $conn->executeStatement(
                                $updatePreviousYearQuery,
                                [
                                    'carryOver' => $newCarryOver,
                                    'id' => $previousYearBalance['id']
                                ]
                            );

                            $conn->commit();

                            $this->logger->debug('Updated both years:', [
                                'currentYear' => [
                                    'id' => $currentYearBalance['id'],
                                    'newCarryOver' => $newCarryOver
                                ],
                                'previousYear' => [
                                    'id' => $previousYearBalance['id'],
                                    'newCarryOver' => $newCarryOver
                                ]
                            ]);
                        } catch (\Exception $e) {
                            $conn->rollBack();
                            throw $e;
                        }
                    }
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