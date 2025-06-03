<?php

namespace App\EventSubscriber;

use App\Entity\Permission;
use App\Service\EmailService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Psr\Log\LoggerInterface;

#[AsDoctrineListener(event: Events::postPersist)]
class PermissionCreatedSubscriber
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

        if (!$entity instanceof Permission) {
            $this->logger->info('Entity is not a Permission, skipping');
            return;
        }

        $this->logger->info('Permission created event triggered', [
            'user' => $entity->getUser()->getEmail(),
            'id' => $entity->getId(),
            'startTime' => $entity->getStartTime()->format('d/m/Y H:i'),
            'endTime' => $entity->getEndTime()->format('d/m/Y H:i'),
            'reason' => $entity->getReason()
        ]);

        $this->sendEmployeeNotificationEmail($entity);
        $this->sendDirectorNotificationEmail($entity);
    }

    private function sendEmployeeNotificationEmail(Permission $permission): void
    {
        $subject = 'Votre demande de permission a été créée';
        $body = $this->getEmployeeNotificationTemplate($permission);

        try {
            $this->logger->info('Attempting to send permission notification email to employee', [
                'to' => $permission->getUser()->getEmail(),
                'from' => 'no-reply@sydev.com'
            ]);

            $this->emailService->sendEmail(
                'no-reply@sydev.com',
                $permission->getUser()->getEmail(),
                null,
                $subject,
                $body
            );

            $this->logger->info('Permission notification email sent successfully to employee');
        } catch (\Exception $e) {
            $this->logger->error('Failed to send permission notification email to employee: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_email' => $permission->getUser()->getEmail()
            ]);
        }
    }

    private function sendDirectorNotificationEmail(Permission $permission): void
    {
        $subject = 'Nouvelle demande de permission à valider';
        $body = $this->getDirectorNotificationTemplate($permission);

        try {
            $this->logger->info('Attempting to send permission notification email to director', [
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

            $this->logger->info('Permission notification email sent successfully to director');
        } catch (\Exception $e) {
            $this->logger->error('Failed to send permission notification email to director: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'director_email' => self::DIRECTOR_EMAIL
            ]);
        }
    }

    private function getEmployeeNotificationTemplate(Permission $permission): string
    {
        $permissionStartTime = $permission->getStartTime()->format('d/m/Y H:i');
        $permissionEndTime = $permission->getEndTime()->format('d/m/Y H:i');
        $status = ucfirst($permission->getStatus());
        $user = $permission->getUser();

        $replacementDetails = '';
        if ($permission->getReplacementSlots() && !$permission->getReplacementSlots()->isEmpty()) {
            $replacementDetails = '<div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $replacementDetails .= '<h3 style="margin-top: 0; color: #0369a1;">Détails des remplacements :</h3>';
            
            $slots = $permission->getReplacementSlots()->toArray();
            usort($slots, function($a, $b) {
                $dateCompare = $a->getDate()->format('Y-m-d') <=> $b->getDate()->format('Y-m-d');
                if ($dateCompare === 0) {
                    return $a->getStartTime()->format('H:i') <=> $b->getStartTime()->format('H:i');
                }
                return $dateCompare;
            });
            
            foreach ($slots as $slot) {
                $date = $slot->getDate();
                $startDateTime = clone $date;
                $endDateTime = clone $date;
                
                $slotStartTime = $slot->getStartTime();
                $slotEndTime = $slot->getEndTime();
                
                $startDateTime->setTime(
                    (int)$slotStartTime->format('H'),
                    (int)$slotStartTime->format('i')
                );
                
                $endDateTime->setTime(
                    (int)$slotEndTime->format('H'),
                    (int)$slotEndTime->format('i')
                );
                
                $replacementDetails .= "<div style='margin-bottom: 10px;'>";
                $replacementDetails .= "<p style='margin: 5px 0;'><strong>Période :</strong> Le {$date->format('d/m/Y')} de {$startDateTime->format('H:i')} à {$endDateTime->format('H:i')}</p>";
                $replacementDetails .= "</div>";
            }
            
            $replacementDetails .= '</div>';
        }

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Demande de permission créée</h1>
            
            <p>Bonjour {$user->getFirstName()},</p>
            
            <p>Votre demande de permission a été créée avec succès.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Détails de la demande :</h3>
                <p><strong>Date et heure de début :</strong> {$permissionStartTime}</p>
                <p><strong>Date et heure de fin :</strong> {$permissionEndTime}</p>
                <p><strong>Motif :</strong> {$permission->getReason()}</p>
                <p><strong>Statut :</strong> {$status}</p>
            </div>
            
            {$replacementDetails}
            
            <p>Votre responsable sera notifié de cette demande et l'examinera dans les plus brefs délais.</p>
            
            <p>Vous recevrez une notification par email dès que votre demande aura été traitée.</p>
            
            <p style="color: #4b5563; font-size: 0.9em;">Si vous souhaitez modifier ou annuler cette demande, veuillez contacter votre responsable.</p>
            
            <p>Cordialement,<br>L'équipe SYDEV</p>
        </div>
        HTML;
    }

    private function getDirectorNotificationTemplate(Permission $permission): string
    {
        $permissionStartTime = $permission->getStartTime()->format('d/m/Y H:i');
        $permissionEndTime = $permission->getEndTime()->format('d/m/Y H:i');
        $status = ucfirst($permission->getStatus());
        $user = $permission->getUser();

        $replacementDetails = '';
        if ($permission->getReplacementSlots() && !$permission->getReplacementSlots()->isEmpty()) {
            $replacementDetails = '<div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $replacementDetails .= '<h3 style="margin-top: 0; color: #0369a1;">Détails des remplacements :</h3>';
            
            $slots = $permission->getReplacementSlots()->toArray();
            usort($slots, function($a, $b) {
                $dateCompare = $a->getDate()->format('Y-m-d') <=> $b->getDate()->format('Y-m-d');
                if ($dateCompare === 0) {
                    return $a->getStartTime()->format('H:i') <=> $b->getStartTime()->format('H:i');
                }
                return $dateCompare;
            });
            
            foreach ($slots as $slot) {
                $date = $slot->getDate();
                $startDateTime = clone $date;
                $endDateTime = clone $date;
                
                $slotStartTime = $slot->getStartTime();
                $slotEndTime = $slot->getEndTime();
                
                $startDateTime->setTime(
                    (int)$slotStartTime->format('H'),
                    (int)$slotStartTime->format('i')
                );
                
                $endDateTime->setTime(
                    (int)$slotEndTime->format('H'),
                    (int)$slotEndTime->format('i')
                );
                
                $replacementDetails .= "<div style='margin-bottom: 10px;'>";
                $replacementDetails .= "<p style='margin: 5px 0;'><strong>Période :</strong> Le {$date->format('d/m/Y')} de {$startDateTime->format('H:i')} à {$endDateTime->format('H:i')}</p>";
                $replacementDetails .= "</div>";
            }
            
            $replacementDetails .= '</div>';
        }

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Nouvelle demande de permission à valider</h1>
            
            <p>Bonjour,</p>
            
            <p>Une nouvelle demande de permission a été créée et nécessite votre validation.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Détails de la demande :</h3>
                <p><strong>Employé :</strong> {$user->getFirstName()} {$user->getLastName()} ({$user->getTrigram()})</p>
                <p><strong>Email :</strong> {$user->getEmail()}</p>
                <p><strong>Date et heure de début :</strong> {$permissionStartTime}</p>
                <p><strong>Date et heure de fin :</strong> {$permissionEndTime}</p>
                <p><strong>Motif :</strong> {$permission->getReason()}</p>
                <p><strong>Statut actuel :</strong> {$status}</p>
            </div>
            
            {$replacementDetails}
            
            <p>L'employé a été notifié automatiquement de cette mise à jour.</p>
            
            <p>Cordialement,<br>L'équipe SYDEV</p>
        </div>
        HTML;
    }

    private function slotExistsInCollection($slot, $collection): bool
    {
        $slotDateStr = $slot->getDate()->format('Y-m-d');
        $slotStartStr = $slot->getStartTime()->format('H:i');
        $slotEndStr = $slot->getEndTime()->format('H:i');

        foreach ($collection as $item) {
            $itemDateStr = $item->getDate()->format('Y-m-d');
            $itemStartStr = $item->getStartTime()->format('H:i');
            $itemEndStr = $item->getEndTime()->format('H:i');

            if (
                $itemDateStr === $slotDateStr &&
                $itemStartStr === $slotStartStr &&
                $itemEndStr === $slotEndStr
            ) {
                return true;
            }
        }
        return false;
    }
} 