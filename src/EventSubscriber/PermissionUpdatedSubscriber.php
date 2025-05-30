<?php

namespace App\EventSubscriber;

use App\Entity\Permission;
use App\Service\EmailService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Psr\Log\LoggerInterface;

#[AsDoctrineListener(event: Events::postUpdate)]
class PermissionUpdatedSubscriber
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

        if (!$entity instanceof Permission) {
            $this->logger->info('Entity is not a Permission, skipping');
            return;
        }

        // Get the changes from UnitOfWork
        $uow = $args->getObjectManager()->getUnitOfWork();
        $uow->computeChangeSets();
        $changeSet = $uow->getEntityChangeSet($entity);

        // Récupérer la date de la permission
        $permissionDate = $entity->getDate();

        // Fix DateTime objects in the changeset
        if (isset($changeSet['startTime'])) {
            $oldStartTime = $changeSet['startTime'][0];
            $newStartTime = $changeSet['startTime'][1];

            if ($oldStartTime instanceof \DateTime) {
                // Copier la date de la permission pour l'ancien temps
                $oldStartTime->setDate(
                    (int)$permissionDate->format('Y'),
                    (int)$permissionDate->format('m'),
                    (int)$permissionDate->format('d')
                );
            }

            if ($newStartTime instanceof \DateTime) {
                // Copier la date de la permission pour le nouveau temps
                $newStartTime->setDate(
                    (int)$permissionDate->format('Y'),
                    (int)$permissionDate->format('m'),
                    (int)$permissionDate->format('d')
                );
            }
        }

        if (isset($changeSet['endTime'])) {
            $oldEndTime = $changeSet['endTime'][0];
            $newEndTime = $changeSet['endTime'][1];

            if ($oldEndTime instanceof \DateTime) {
                // Copier la date de la permission pour l'ancien temps
                $oldEndTime->setDate(
                    (int)$permissionDate->format('Y'),
                    (int)$permissionDate->format('m'),
                    (int)$permissionDate->format('d')
                );
            }

            if ($newEndTime instanceof \DateTime) {
                // Copier la date de la permission pour le nouveau temps
                $newEndTime->setDate(
                    (int)$permissionDate->format('Y'),
                    (int)$permissionDate->format('m'),
                    (int)$permissionDate->format('d')
                );
            }
        }

        $this->logger->info('Permission updated event triggered', [
            'user' => $entity->getUser()->getEmail(),
            'id' => $entity->getId(),
            'date' => $permissionDate->format('d/m/Y'),
            'startTime' => $entity->getStartTime()->format('H:i'),
            'endTime' => $entity->getEndTime()->format('H:i'),
            'reason' => $entity->getReason(),
            'status' => $entity->getStatus(),
            'changes' => $changeSet
        ]);

        // Send notification emails
        $this->sendEmployeeNotificationEmail($entity, $changeSet);
        $this->sendDirectorNotificationEmail($entity, $changeSet);
    }

    private function sendEmployeeNotificationEmail(Permission $permission, array $changes): void
    {
        $subject = 'Mise à jour de votre demande de permission';
        $body = $this->getEmployeeNotificationTemplate($permission, $changes);

        try {
            $this->logger->info('Attempting to send permission update notification to employee', [
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

            $this->logger->info('Permission update notification sent successfully to employee');
        } catch (\Exception $e) {
            $this->logger->error('Failed to send permission update notification to employee: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_email' => $permission->getUser()->getEmail()
            ]);
        }
    }

    private function sendDirectorNotificationEmail(Permission $permission, array $changes): void
    {
        $subject = 'Mise à jour d\'une demande de permission';
        $body = $this->getDirectorNotificationTemplate($permission, $changes);

        try {
            $this->logger->info('Attempting to send permission update notification to director', [
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

            $this->logger->info('Permission update notification sent successfully to director');
        } catch (\Exception $e) {
            $this->logger->error('Failed to send permission update notification to director: ' . $e->getMessage(), [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'director_email' => self::DIRECTOR_EMAIL
            ]);
        }
    }

    private function getEmployeeNotificationTemplate(Permission $permission, array $changes): string
    {
        // Combine date with time for start and end
        $permissionDate = $permission->getDate();
        $startDateTime = clone $permissionDate;
        $endDateTime = clone $permissionDate;

        $startDateTime->setTime(
            (int)$permission->getStartTime()->format('H'),
            (int)$permission->getStartTime()->format('i')
        );

        $endDateTime->setTime(
            (int)$permission->getEndTime()->format('H'),
            (int)$permission->getEndTime()->format('i')
        );

        $permissionStartTime = $startDateTime->format('d/m/Y H:i');
        $permissionEndTime = $endDateTime->format('d/m/Y H:i');
        $status = ucfirst($permission->getStatus());
        $user = $permission->getUser();

        $statusMessage = match ($permission->getStatus()) {
            'Approuvé' => '<p style="color: #059669;">Votre demande de permission a été approuvée !</p>',
            'Rejeté' => '<p style="color: #DC2626;">Votre demande de permission a été refusée.</p>',
            default => '<p>Votre demande de permission a été mise à jour.</p>'
        };

        // Prepare changes message
        $changesMessage = '';
        if (isset($changes['startTime']) || isset($changes['endTime']) || isset($changes['reason'])) {
            $changesMessage = '<div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $changesMessage .= '<h3 style="margin-top: 0; color: #92400e;">Modifications apportées :</h3>';

            if (isset($changes['startTime'])) {
                $oldStartTime = $changes['startTime'][0]->format('d/m/Y H:i');
                $newStartTime = $changes['startTime'][1]->format('d/m/Y H:i');
                $changesMessage .= "<p><strong>Date et heure de début :</strong> {$oldStartTime} → {$newStartTime}</p>";
            }

            if (isset($changes['endTime'])) {
                $oldEndTime = $changes['endTime'][0]->format('d/m/Y H:i');
                $newEndTime = $changes['endTime'][1]->format('d/m/Y H:i');
                $changesMessage .= "<p><strong>Date et heure de fin :</strong> {$oldEndTime} → {$newEndTime}</p>";
            }

            if (isset($changes['reason'])) {
                $oldReason = $changes['reason'][0];
                $newReason = $changes['reason'][1];
                $changesMessage .= "<p><strong>Motif :</strong> {$oldReason} → {$newReason}</p>";
            }

            $changesMessage .= '</div>';
        }

        // Prepare replacement details
        $replacementDetails = '';
        if ($permission->getReplacementSlots() && !$permission->getReplacementSlots()->isEmpty()) {
            $replacementDetails = '<div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $replacementDetails .= '<h3 style="margin-top: 0; color: #0369a1;">Détails des remplacements :</h3>';

            // Trier les créneaux par date et heure
            $slots = $permission->getReplacementSlots()->toArray();
            usort($slots, function ($a, $b) {
                $dateCompare = $a->getDate()->format('Y-m-d') <=> $b->getDate()->format('Y-m-d');
                if ($dateCompare === 0) {
                    return $a->getStartTime()->format('H:i') <=> $b->getStartTime()->format('H:i');
                }
                return $dateCompare;
            });

            foreach ($slots as $slot) {
                // Combine date with time
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

        // Check for changes in replacement slots
        if (isset($changes['replacementSlots'])) {
            $replacementChanges = '<div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $replacementChanges .= '<h3 style="margin-top: 0; color: #92400e;">Modifications des remplacements :</h3>';

            // Compare old and new replacement slots
            $oldSlots = $changes['replacementSlots'][0];
            $newSlots = $changes['replacementSlots'][1];

            // Trier les anciens créneaux
            usort($oldSlots, function ($a, $b) {
                $dateCompare = $a->getDate()->format('Y-m-d') <=> $b->getDate()->format('Y-m-d');
                if ($dateCompare === 0) {
                    return $a->getStartTime()->format('H:i') <=> $b->getStartTime()->format('H:i');
                }
                return $dateCompare;
            });

            // Show removed slots
            foreach ($oldSlots as $oldSlot) {
                if (!$this->slotExistsInCollection($oldSlot, $newSlots)) {
                    // Combine date with time
                    $date = $oldSlot->getDate();
                    $startDateTime = clone $date;
                    $endDateTime = clone $date;

                    $slotStartTime = $oldSlot->getStartTime();
                    $slotEndTime = $oldSlot->getEndTime();

                    $startDateTime->setTime(
                        (int)$slotStartTime->format('H'),
                        (int)$slotStartTime->format('i')
                    );

                    $endDateTime->setTime(
                        (int)$slotEndTime->format('H'),
                        (int)$slotEndTime->format('i')
                    );

                    $replacementChanges .= "<div style='margin-bottom: 10px; color: #DC2626;'>";
                    $replacementChanges .= "<p style='margin: 5px 0;'><strong>Remplacement supprimé :</strong></p>";
                    $replacementChanges .= "<p style='margin: 5px 0;'>Le {$date->format('d/m/Y')} de {$startDateTime->format('H:i')} à {$endDateTime->format('H:i')}</p>";
                    $replacementChanges .= "</div>";
                }
            }

            // Trier les nouveaux créneaux
            usort($newSlots, function ($a, $b) {
                $dateCompare = $a->getDate()->format('Y-m-d') <=> $b->getDate()->format('Y-m-d');
                if ($dateCompare === 0) {
                    return $a->getStartTime()->format('H:i') <=> $b->getStartTime()->format('H:i');
                }
                return $dateCompare;
            });

            // Show added slots
            foreach ($newSlots as $newSlot) {
                if (!$this->slotExistsInCollection($newSlot, $oldSlots)) {
                    // Combine date with time
                    $date = $newSlot->getDate();
                    $startDateTime = clone $date;
                    $endDateTime = clone $date;

                    $slotStartTime = $newSlot->getStartTime();
                    $slotEndTime = $newSlot->getEndTime();

                    $startDateTime->setTime(
                        (int)$slotStartTime->format('H'),
                        (int)$slotStartTime->format('i')
                    );

                    $endDateTime->setTime(
                        (int)$slotEndTime->format('H'),
                        (int)$slotEndTime->format('i')
                    );

                    $replacementChanges .= "<div style='margin-bottom: 10px; color: #059669;'>";
                    $replacementChanges .= "<p style='margin: 5px 0;'><strong>Nouveau remplacement ajouté :</strong></p>";
                    $replacementChanges .= "<p style='margin: 5px 0;'>Le {$date->format('d/m/Y')} de {$startDateTime->format('H:i')} à {$endDateTime->format('H:i')}</p>";
                    $replacementChanges .= "</div>";
                }
            }

            $replacementChanges .= '</div>';
            $changesMessage .= $replacementChanges;
        }

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Mise à jour de votre demande de permission</h1>
            
            <p>Bonjour {$user->getFirstName()},</p>
            
            {$statusMessage}
            
            {$changesMessage}
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Détails mis à jour de la demande :</h3>
                <p><strong>Date et heure de début :</strong> {$permissionStartTime}</p>
                <p><strong>Date et heure de fin :</strong> {$permissionEndTime}</p>
                <p><strong>Motif :</strong> {$permission->getReason()}</p>
                <p><strong>Statut :</strong> {$status}</p>
            </div>
            
            {$replacementDetails}
            
            <p>Si vous avez des questions concernant cette mise à jour, n'hésitez pas à contacter votre responsable.</p>
            
            <p>Cordialement,<br>L'équipe SYDEV</p>
        </div>
        HTML;
    }

    private function getDirectorNotificationTemplate(Permission $permission, array $changes): string
    {
        // Combine date with time for start and end
        $permissionDate = $permission->getDate();
        $startDateTime = clone $permissionDate;
        $endDateTime = clone $permissionDate;

        $startDateTime->setTime(
            (int)$permission->getStartTime()->format('H'),
            (int)$permission->getStartTime()->format('i')
        );

        $endDateTime->setTime(
            (int)$permission->getEndTime()->format('H'),
            (int)$permission->getEndTime()->format('i')
        );

        $permissionStartTime = $startDateTime->format('d/m/Y H:i');
        $permissionEndTime = $endDateTime->format('d/m/Y H:i');
        $status = ucfirst($permission->getStatus());
        $user = $permission->getUser();

        $statusMessage = match ($permission->getStatus()) {
            'approved' => '<p style="color: #059669;">La demande de permission a été approuvée.</p>',
            'rejected' => '<p style="color: #DC2626;">La demande de permission a été refusée.</p>',
            default => '<p>La demande de permission a été mise à jour.</p>'
        };

        // Prepare changes message
        $changesMessage = '';
        if (isset($changes['startTime']) || isset($changes['endTime']) || isset($changes['reason'])) {
            $changesMessage = '<div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $changesMessage .= '<h3 style="margin-top: 0; color: #92400e;">Modifications apportées :</h3>';

            if (isset($changes['startTime'])) {
                $oldStartTime = $changes['startTime'][0]->format('d/m/Y H:i');
                $newStartTime = $changes['startTime'][1]->format('d/m/Y H:i');
                $changesMessage .= "<p><strong>Date et heure de début :</strong> {$oldStartTime} → {$newStartTime}</p>";
            }

            if (isset($changes['endTime'])) {
                $oldEndTime = $changes['endTime'][0]->format('d/m/Y H:i');
                $newEndTime = $changes['endTime'][1]->format('d/m/Y H:i');
                $changesMessage .= "<p><strong>Date et heure de fin :</strong> {$oldEndTime} → {$newEndTime}</p>";
            }

            if (isset($changes['reason'])) {
                $oldReason = $changes['reason'][0];
                $newReason = $changes['reason'][1];
                $changesMessage .= "<p><strong>Motif :</strong> {$oldReason} → {$newReason}</p>";
            }

            $changesMessage .= '</div>';
        }

        // Prepare replacement details
        $replacementDetails = '';
        if ($permission->getReplacementSlots() && !$permission->getReplacementSlots()->isEmpty()) {
            $replacementDetails = '<div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $replacementDetails .= '<h3 style="margin-top: 0; color: #0369a1;">Détails des remplacements :</h3>';

            // Trier les créneaux par date et heure
            $slots = $permission->getReplacementSlots()->toArray();
            usort($slots, function ($a, $b) {
                $dateCompare = $a->getDate()->format('Y-m-d') <=> $b->getDate()->format('Y-m-d');
                if ($dateCompare === 0) {
                    return $a->getStartTime()->format('H:i') <=> $b->getStartTime()->format('H:i');
                }
                return $dateCompare;
            });

            foreach ($slots as $slot) {
                // Combine date with time
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

        // Check for changes in replacement slots
        if (isset($changes['replacementSlots'])) {
            $replacementChanges = '<div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $replacementChanges .= '<h3 style="margin-top: 0; color: #92400e;">Modifications des remplacements :</h3>';

            // Compare old and new replacement slots
            $oldSlots = $changes['replacementSlots'][0];
            $newSlots = $changes['replacementSlots'][1];

            // Trier les anciens créneaux
            usort($oldSlots, function ($a, $b) {
                $dateCompare = $a->getDate()->format('Y-m-d') <=> $b->getDate()->format('Y-m-d');
                if ($dateCompare === 0) {
                    return $a->getStartTime()->format('H:i') <=> $b->getStartTime()->format('H:i');
                }
                return $dateCompare;
            });

            // Show removed slots
            foreach ($oldSlots as $oldSlot) {
                if (!$this->slotExistsInCollection($oldSlot, $newSlots)) {
                    // Combine date with time
                    $date = $oldSlot->getDate();
                    $startDateTime = clone $date;
                    $endDateTime = clone $date;

                    $slotStartTime = $oldSlot->getStartTime();
                    $slotEndTime = $oldSlot->getEndTime();

                    $startDateTime->setTime(
                        (int)$slotStartTime->format('H'),
                        (int)$slotStartTime->format('i')
                    );

                    $endDateTime->setTime(
                        (int)$slotEndTime->format('H'),
                        (int)$slotEndTime->format('i')
                    );

                    $replacementChanges .= "<div style='margin-bottom: 10px; color: #DC2626;'>";
                    $replacementChanges .= "<p style='margin: 5px 0;'><strong>Remplacement supprimé :</strong></p>";
                    $replacementChanges .= "<p style='margin: 5px 0;'>Le {$date->format('d/m/Y')} de {$startDateTime->format('H:i')} à {$endDateTime->format('H:i')}</p>";
                    $replacementChanges .= "</div>";
                }
            }

            // Trier les nouveaux créneaux
            usort($newSlots, function ($a, $b) {
                $dateCompare = $a->getDate()->format('Y-m-d') <=> $b->getDate()->format('Y-m-d');
                if ($dateCompare === 0) {
                    return $a->getStartTime()->format('H:i') <=> $b->getStartTime()->format('H:i');
                }
                return $dateCompare;
            });

            // Show added slots
            foreach ($newSlots as $newSlot) {
                if (!$this->slotExistsInCollection($newSlot, $oldSlots)) {
                    // Combine date with time
                    $date = $newSlot->getDate();
                    $startDateTime = clone $date;
                    $endDateTime = clone $date;

                    $slotStartTime = $newSlot->getStartTime();
                    $slotEndTime = $newSlot->getEndTime();

                    $startDateTime->setTime(
                        (int)$slotStartTime->format('H'),
                        (int)$slotStartTime->format('i')
                    );

                    $endDateTime->setTime(
                        (int)$slotEndTime->format('H'),
                        (int)$slotEndTime->format('i')
                    );

                    $replacementChanges .= "<div style='margin-bottom: 10px; color: #059669;'>";
                    $replacementChanges .= "<p style='margin: 5px 0;'><strong>Nouveau remplacement ajouté :</strong></p>";
                    $replacementChanges .= "<p style='margin: 5px 0;'>Le {$date->format('d/m/Y')} de {$startDateTime->format('H:i')} à {$endDateTime->format('H:i')}</p>";
                    $replacementChanges .= "</div>";
                }
            }

            $replacementChanges .= '</div>';
            $changesMessage .= $replacementChanges;
        }

        return <<<HTML
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Mise à jour d'une demande de permission</h1>
            
            <p>Bonjour,</p>
            
            {$statusMessage}
            
            {$changesMessage}
            
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
