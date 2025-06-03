<?php

namespace App\EventSubscriber;

use App\Entity\User;
use App\Service\EmailService;
use App\Service\LeaveBalanceManager;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\Bundle\DoctrineBundle\EventSubscriber\EventSubscriberInterface;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Psr\Log\LoggerInterface;

#[AsDoctrineListener(event: Events::postPersist)]
class UserCreatedSubscriber implements EventSubscriberInterface
{
    private EmailService $emailService;
    private LoggerInterface $logger;
    private LeaveBalanceManager $leaveBalanceManager;

    public function __construct(
        EmailService $emailService,
        LoggerInterface $logger,
        LeaveBalanceManager $leaveBalanceManager
    ) {
        $this->emailService = $emailService;
        $this->logger = $logger;
        $this->leaveBalanceManager = $leaveBalanceManager;
    }

    public function getSubscribedEvents(): array
    {
        return [
            Events::postPersist,
        ];
    }

    public function postPersist(LifecycleEventArgs $args): void
    {
        $this->logger->info('PostPersist event triggered');
        
        $entity = $args->getObject();
        
        $this->logger->info('Entity type received', [
            'class' => get_class($entity)
        ]);

        if (!$entity instanceof User) {
            $this->logger->info('Entity is not a User, skipping');
            return;
        }

        $this->logger->info('User created event triggered', [
            'email' => $entity->getEmail(),
            'id' => $entity->getId(),
            'firstName' => $entity->getFirstName(),
            'lastName' => $entity->getLastName()
        ]);

        $this->sendWelcomeEmail($entity);

        $startDate = $entity->getStartDate();
        $currentYear = (int)date('Y');
        
        if (!$startDate) {
            $this->logger->warning('User has no start date, using current year with full balance');
            $this->leaveBalanceManager->initializeYearlyBalanceWithProrata(
                $entity,
                $currentYear,
                12
            );
            return;
        }

        $startYear = (int)$startDate->format('Y');
        $startMonth = (int)$startDate->format('n');

        for ($year = $startYear; $year <= $currentYear; $year++) {
            $monthsWorked = 12;

            if ($year === $startYear) {
                $monthsWorked = 13 - $startMonth;
            }

            $this->logger->info('Initializing leave balance', [
                'user' => $entity->getEmail(),
                'year' => $year,
                'monthsWorked' => $monthsWorked,
                'startDate' => $startDate->format('Y-m-d')
            ]);

            $this->leaveBalanceManager->initializeYearlyBalanceWithProrata(
                $entity,
                $year,
                $monthsWorked
            );
        }
    }

    private function sendWelcomeEmail(User $user): void
    {
        $subject = 'Bienvenue chez SYDEV';
        $body = $this->getWelcomeEmailTemplate($user);

        try {
            $this->logger->info('Attempting to send welcome email', [
                'to' => $user->getEmail(),
                'from' => 'no-reply@sydev.com'
            ]);

            $this->emailService->sendEmail(
                'no-reply@sydev.com',
                $user->getEmail(), 
                null,
                $subject,
                $body
            );

            $this->logger->info('Welcome email sent successfully');
        } catch (\Exception $e) {
            $this->logger->error('Failed to send welcome email: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_email' => $user->getEmail()
            ]);
        }
    }

    private function getWelcomeEmailTemplate(User $user): string
    {
        $currentYear = (int)date('Y');
        $leaveBalance = $this->leaveBalanceManager->getYearlyBalance($user, $currentYear);

        $paidLeaveBalance = $leaveBalance ? $leaveBalance->getRemainingPaidLeave() : 0;
        $sickLeaveBalance = $leaveBalance ? $leaveBalance->getRemainingSickLeave() : 0;

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Bienvenue chez SYDEV !</h1>
            
            <p>Bonjour {$user->getFirstName()},</p>
            
            <p>Nous sommes ravis de vous accueillir chez SYDEV. Votre compte a été créé avec succès.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Vos informations de connexion :</h3>
                <p><strong>Email :</strong> {$user->getEmail()}</p>
                <p><strong>Trigramme :</strong> {$user->getTrigram()}</p>
                <p><strong>Mot de passe :</strong> {$user->getPassword()}</p>
            </div>
            
            <p>Voici un récapitulatif de vos droits aux congés pour l'année {$currentYear} :</p>
            <ul>
                <li>Congés payés : {$paidLeaveBalance} jours</li>
                <li>Congés maladie : {$sickLeaveBalance} jours</li>
            </ul>
            
            <p>Pour accéder à votre espace personnel, utilisez votre email et le mot de passe qui vous a été communiqué.</p>
            
            <p>Si vous avez des questions, n'hésitez pas à contacter votre responsable.</p>
            
            <p>Cordialement,<br>L'équipe SYDEV</p>
        </div>
        HTML;
    }
} 