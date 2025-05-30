<?php

namespace App\EventSubscriber;

use App\Entity\Leave;
use App\Service\EmailService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Psr\Log\LoggerInterface;

#[AsDoctrineListener(event: Events::postPersist)]
class LeaveCreatedSubscriber
{
    private const DIRECTOR_EMAIL = 'ashvin.dowlutrao@sydev.com';
    private EmailService $emailService;
    private LoggerInterface $logger;

    public function __construct(
        EmailService $emailService,
        LoggerInterface $logger
    ) {
        $this->emailService = $emailService;
        $this->logger = $logger;
    }

    public function postPersist(LifecycleEventArgs $args): void
    {
        $this->logger->info('PostPersist event triggered');
        
        $entity = $args->getObject();
        
        $this->logger->info('Entity type received', [
            'class' => get_class($entity)
        ]);

        if (!$entity instanceof Leave) {
            $this->logger->info('Entity is not a Leave, skipping');
            return;
        }

        $this->logger->info('Leave created event triggered', [
            'user' => $entity->getUser()->getEmail(),
            'id' => $entity->getId(),
            'startDate' => $entity->getStartDate()->format('Y-m-d'),
            'endDate' => $entity->getEndDate()->format('Y-m-d'),
            'type' => $entity->getType()
        ]);

        // Send notification emails
        $this->sendEmployeeNotificationEmail($entity);
        $this->sendDirectorNotificationEmail($entity);
    }

    private function sendEmployeeNotificationEmail(Leave $leave): void
    {
        $subject = 'Votre demande de congé a été créée';
        $body = $this->getEmployeeNotificationTemplate($leave);

        try {
            $this->logger->info('Attempting to send leave notification email to employee', [
                'to' => $leave->getUser()->getEmail(),
                'from' => 'no-reply@sydev.com'
            ]);

            $this->emailService->sendEmail(
                'no-reply@sydev.com',
                $leave->getUser()->getEmail(),
                null,
                $subject,
                $body
            );

            $this->logger->info('Leave notification email sent successfully to employee');
        } catch (\Exception $e) {
            $this->logger->error('Failed to send leave notification email to employee: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_email' => $leave->getUser()->getEmail()
            ]);
        }
    }

    private function sendDirectorNotificationEmail(Leave $leave): void
    {
        $subject = 'Nouvelle demande de congé à valider';
        $body = $this->getDirectorNotificationTemplate($leave);

        try {
            $this->logger->info('Attempting to send leave notification email to director', [
                'to' => self::DIRECTOR_EMAIL,
                'from' => 'no-reply@sydev.com'
            ]);

            $this->emailService->sendEmail(
                'no-reply@sydev.com',
                self::DIRECTOR_EMAIL,
                null,
                $subject,
                $body
            );

            $this->logger->info('Leave notification email sent successfully to director');
        } catch (\Exception $e) {
            $this->logger->error('Failed to send leave notification email to director: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'director_email' => self::DIRECTOR_EMAIL
            ]);
        }
    }

    private function getEmployeeNotificationTemplate(Leave $leave): string
    {
        $startDate = $leave->getStartDate()->format('d/m/Y');
        $endDate = $leave->getEndDate()->format('d/m/Y');
        $status = ucfirst($leave->getStatus());
        $type = ucfirst($leave->getType());
        $user = $leave->getUser();
        $totalDays = $leave->getTotalDays();

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Demande de congé créée</h1>
            
            <p>Bonjour {$user->getFirstName()},</p>
            
            <p>Votre demande de congé a été créée avec succès.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Détails de la demande :</h3>
                <p><strong>Type de congé :</strong> {$type}</p>
                <p><strong>Date de début :</strong> {$startDate}</p>
                <p><strong>Date de fin :</strong> {$endDate}</p>
                <p><strong>Nombre de jours :</strong> {$totalDays} jour(s)</p>
                <p><strong>Statut :</strong> {$status}</p>
            </div>
            
            <p>Votre responsable sera notifié de cette demande et l'examinera dans les plus brefs délais.</p>
            
            <p>Vous recevrez une notification par email dès que votre demande aura été traitée.</p>
            
            <p style="color: #4b5563; font-size: 0.9em;">Si vous souhaitez modifier ou annuler cette demande, veuillez contacter votre responsable.</p>
            
            <p>Cordialement,<br>L'équipe SYDEV</p>
        </div>
        HTML;
    }

    private function getDirectorNotificationTemplate(Leave $leave): string
    {
        $startDate = $leave->getStartDate()->format('d/m/Y');
        $endDate = $leave->getEndDate()->format('d/m/Y');
        $status = ucfirst($leave->getStatus());
        $type = ucfirst($leave->getType());
        $user = $leave->getUser();
        $totalDays = $leave->getTotalDays();

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Nouvelle demande de congé à valider</h1>
            
            <p>Bonjour,</p>
            
            <p>Une nouvelle demande de congé a été créée et nécessite votre validation.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Détails de la demande :</h3>
                <p><strong>Employé :</strong> {$user->getFirstName()} {$user->getLastName()} ({$user->getTrigram()})</p>
                <p><strong>Email :</strong> {$user->getEmail()}</p>
                <p><strong>Type de congé :</strong> {$type}</p>
                <p><strong>Date de début :</strong> {$startDate}</p>
                <p><strong>Date de fin :</strong> {$endDate}</p>
                <p><strong>Nombre de jours :</strong> {$totalDays} jour(s)</p>
                <p><strong>Statut actuel :</strong> {$status}</p>
            </div>
            
            <p>Veuillez examiner cette demande et la valider ou la rejeter dans les plus brefs délais.</p>
            
            <p>L'employé sera notifié automatiquement de votre décision.</p>
            
            <p>Cordialement,<br>L'équipe SYDEV</p>
        </div>
        HTML;
    }
} 