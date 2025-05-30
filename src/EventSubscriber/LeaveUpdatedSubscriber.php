<?php

namespace App\EventSubscriber;

use App\Entity\Leave;
use App\Service\EmailService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Psr\Log\LoggerInterface;

#[AsDoctrineListener(event: Events::postUpdate)]
class LeaveUpdatedSubscriber
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

    public function postUpdate(LifecycleEventArgs $args): void
    {
        $this->logger->info('PostUpdate event triggered');

        $entity = $args->getObject();

        $this->logger->info('Entity type received', [
            'class' => get_class($entity)
        ]);

        if (!$entity instanceof Leave) {
            $this->logger->info('Entity is not a Leave, skipping');
            return;
        }

        // Get the changes from UnitOfWork
        $uow = $args->getObjectManager()->getUnitOfWork();
        $uow->computeChangeSets();
        $changeSet = $uow->getEntityChangeSet($entity);

        $this->logger->info('Leave updated event triggered', [
            'user' => $entity->getUser()->getEmail(),
            'id' => $entity->getId(),
            'startDate' => $entity->getStartDate()->format('Y-m-d'),
            'endDate' => $entity->getEndDate()->format('Y-m-d'),
            'type' => $entity->getType(),
            'status' => $entity->getStatus(),
            'changes' => $changeSet
        ]);

        // Send notification emails
        $this->sendEmployeeNotificationEmail($entity, $changeSet);
        $this->sendDirectorNotificationEmail($entity, $changeSet);
    }

    private function sendEmployeeNotificationEmail(Leave $leave, array $changes): void
    {
        $subject = 'Mise à jour de votre demande de congé';
        $body = $this->getEmployeeNotificationTemplate($leave, $changes);

        try {
            $this->logger->info('Attempting to send leave update notification to employee', [
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

            $this->logger->info('Leave update notification sent successfully to employee');
        } catch (\Exception $e) {
            $this->logger->error('Failed to send leave update notification to employee: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_email' => $leave->getUser()->getEmail()
            ]);
        }
    }

    private function sendDirectorNotificationEmail(Leave $leave, array $changes): void
    {
        $subject = 'Mise à jour d\'une demande de congé';
        $body = $this->getDirectorNotificationTemplate($leave, $changes);

        try {
            $this->logger->info('Attempting to send leave update notification to director', [
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

            $this->logger->info('Leave update notification sent successfully to director');
        } catch (\Exception $e) {
            $this->logger->error('Failed to send leave update notification to director: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'director_email' => self::DIRECTOR_EMAIL
            ]);
        }
    }

    private function getEmployeeNotificationTemplate(Leave $leave, array $changes): string
    {
        $startDate = $leave->getStartDate()->format('d/m/Y');
        $endDate = $leave->getEndDate()->format('d/m/Y');
        $status = ucfirst($leave->getStatus());
        $type = ucfirst($leave->getType());
        $user = $leave->getUser();
        $totalDays = $leave->getTotalDays();

        $statusMessage = match ($leave->getStatus()) {
            'Approuvé' => '<p style="color: #059669;">Votre demande de congé a été approuvée !</p>',
            'Rejeté' => '<p style="color: #DC2626;">Votre demande de congé a été refusée.</p>',
            default => '<p>Votre demande de congé a été mise à jour.</p>'
        };

        // Prepare changes message
        $changesMessage = '';
        if (isset($changes['startDate']) || isset($changes['endDate']) || isset($changes['totalDays'])) {
            $changesMessage = '<div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $changesMessage .= '<h3 style="margin-top: 0; color: #92400e;">Modifications :</h3>';

            if (isset($changes['startDate'])) {
                $oldStartDate = $changes['startDate'][0]->format('d/m/Y');
                $newStartDate = $changes['startDate'][1]->format('d/m/Y');
                $changesMessage .= "<p><strong>Date de début :</strong> {$oldStartDate} → {$newStartDate}</p>";
            }

            if (isset($changes['endDate'])) {
                $oldEndDate = $changes['endDate'][0]->format('d/m/Y');
                $newEndDate = $changes['endDate'][1]->format('d/m/Y');
                $changesMessage .= "<p><strong>Date de fin :</strong> {$oldEndDate} → {$newEndDate}</p>";
            }

            if (isset($changes['totalDays'])) {
                $oldTotalDays = $changes['totalDays'][0];
                $newTotalDays = $changes['totalDays'][1];
                $changesMessage .= "<p><strong>Nombre de jours :</strong> {$oldTotalDays} → {$newTotalDays} jour(s)</p>";
            }

            $changesMessage .= '</div>';
        }

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Mise à jour de votre demande de congé</h1>
            
            <p>Bonjour {$user->getFirstName()},</p>
            
            {$statusMessage}
            
            {$changesMessage}
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Détails mis à jour de la demande :</h3>
                <p><strong>Type de congé :</strong> {$type}</p>
                <p><strong>Date de début :</strong> {$startDate}</p>
                <p><strong>Date de fin :</strong> {$endDate}</p>
                <p><strong>Nombre de jours :</strong> {$totalDays} jour(s)</p>
                <p><strong>Statut :</strong> {$status}</p>
            </div>
            
            <p>Si vous avez des questions concernant cette mise à jour, n'hésitez pas à contacter votre responsable.</p>
            
            <p>Cordialement,<br>L'équipe SYDEV</p>
        </div>
        HTML;
    }

    private function getDirectorNotificationTemplate(Leave $leave, array $changes): string
    {
        $startDate = $leave->getStartDate()->format('d/m/Y');
        $endDate = $leave->getEndDate()->format('d/m/Y');
        $status = ucfirst($leave->getStatus());
        $type = ucfirst($leave->getType());
        $user = $leave->getUser();
        $totalDays = $leave->getTotalDays();

        $statusMessage = match ($leave->getStatus()) {
            'approved' => '<p style="color: #059669;">La demande de congé a été approuvée.</p>',
            'rejected' => '<p style="color: #DC2626;">La demande de congé a été refusée.</p>',
            default => '<p>La demande de congé a été mise à jour.</p>'
        };

        // Prepare changes message
        $changesMessage = '';
        if (isset($changes['startDate']) || isset($changes['endDate']) || isset($changes['totalDays'])) {
            $changesMessage = '<div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $changesMessage .= '<h3 style="margin-top: 0; color: #92400e;">Modifications :</h3>';

            if (isset($changes['startDate'])) {
                $oldStartDate = $changes['startDate'][0]->format('d/m/Y');
                $newStartDate = $changes['startDate'][1]->format('d/m/Y');
                $changesMessage .= "<p><strong>Date de début :</strong> {$oldStartDate} → {$newStartDate}</p>";
            }

            if (isset($changes['endDate'])) {
                $oldEndDate = $changes['endDate'][0]->format('d/m/Y');
                $newEndDate = $changes['endDate'][1]->format('d/m/Y');
                $changesMessage .= "<p><strong>Date de fin :</strong> {$oldEndDate} → {$newEndDate}</p>";
            }

            if (isset($changes['totalDays'])) {
                $oldTotalDays = $changes['totalDays'][0];
                $newTotalDays = $changes['totalDays'][1];
                $changesMessage .= "<p><strong>Nombre de jours :</strong> {$oldTotalDays} → {$newTotalDays} jour(s)</p>";
            }

            $changesMessage .= '</div>';
        }

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Mise à jour d'une demande de congé</h1>
            
            <p>Bonjour,</p>
            
            {$statusMessage}
            
            {$changesMessage}
            
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
            
            <p>L'employé a été notifié automatiquement de cette mise à jour.</p>
            
            <p>Cordialement,<br>L'équipe SYDEV</p>
        </div>
        HTML;
    }
}
