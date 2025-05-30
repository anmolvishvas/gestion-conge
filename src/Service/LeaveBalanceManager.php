<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\LeaveBalance;
use Doctrine\ORM\EntityManagerInterface;

class LeaveBalanceManager
{
    private EntityManagerInterface $entityManager;
    
    // Constantes pour les droits annuels
    private const ANNUAL_PAID_LEAVE_DAYS = 22;  // Congés payés annuels
    private const ANNUAL_SICK_LEAVE_DAYS = 15;  // Congés maladie annuels

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function initializeYearlyBalance(User $user, int $year): LeaveBalance
    {
        // Récupérer le solde de l'année précédente s'il existe
        $previousYearBalance = $this->entityManager->getRepository(LeaveBalance::class)
            ->findOneBy(['user' => $user, 'year' => $year - 1]);

        $balance = new LeaveBalance();
        $balance->setUser($user)
            ->setYear($year)
            ->setInitialPaidLeave(22)
            ->setInitialSickLeave(15)
            ->setRemainingPaidLeave(22)
            ->setRemainingSickLeave(15);

        // Si un solde de l'année précédente existe et des jours ont été reportés
        if ($previousYearBalance && $previousYearBalance->getCarriedOverToNextYear() > 0) {
            $balance->setCarriedOverFromPreviousYear($previousYearBalance->getCarriedOverToNextYear());
        }

        $this->entityManager->persist($balance);
        $this->entityManager->flush();

        return $balance;
    }

    public function initializeYearlyBalanceWithProrata(User $user, int $year, int $monthsWorked): LeaveBalance
    {
        // Vérifier si un solde existe déjà
        $existingBalance = $this->entityManager->getRepository(LeaveBalance::class)
            ->findOneBy(['user' => $user, 'year' => $year]);

        if ($existingBalance) {
            return $existingBalance;
        }

        // Si 12 mois, pas de prorata
        if ($monthsWorked >= 12) {
            $proratedPaidLeave = self::ANNUAL_PAID_LEAVE_DAYS;
            $proratedSickLeave = self::ANNUAL_SICK_LEAVE_DAYS;
        } else {
            // Calculer les congés au prorata
            $proratedPaidLeave = (int)round((self::ANNUAL_PAID_LEAVE_DAYS / 12) * $monthsWorked);
            $proratedSickLeave = (int)round((self::ANNUAL_SICK_LEAVE_DAYS / 12) * $monthsWorked);
        }

        $balance = new LeaveBalance();
        $balance->setUser($user)
            ->setYear($year)
            ->setInitialPaidLeave($proratedPaidLeave)
            ->setInitialSickLeave($proratedSickLeave)
            ->setRemainingPaidLeave($proratedPaidLeave)
            ->setRemainingSickLeave($proratedSickLeave)
            ->setCarriedOverFromPreviousYear(0)
            ->setCarriedOverToNextYear(0);

        $this->entityManager->persist($balance);
        $this->entityManager->flush();

        return $balance;
    }

    public function carryOverLeaves(User $user, int $fromYear, int $daysToCarryOver): void
    {
        // Vérifier que le nombre de jours à reporter ne dépasse pas le solde restant
        $currentYearBalance = $this->entityManager->getRepository(LeaveBalance::class)
            ->findOneBy(['user' => $user, 'year' => $fromYear]);

        if (!$currentYearBalance) {
            throw new \RuntimeException("Aucun solde trouvé pour l'année $fromYear");
        }

        $availableDays = $currentYearBalance->getRemainingPaidLeave();
        if ($daysToCarryOver > $availableDays) {
            throw new \RuntimeException("Le nombre de jours à reporter ($daysToCarryOver) dépasse le solde disponible ($availableDays)");
        }

        // Mettre à jour le solde de l'année courante
        $currentYearBalance->setCarriedOverToNextYear($daysToCarryOver);
        $currentYearBalance->setRemainingPaidLeave($availableDays - $daysToCarryOver);

        // Créer ou mettre à jour le solde de l'année suivante
        $nextYearBalance = $this->entityManager->getRepository(LeaveBalance::class)
            ->findOneBy(['user' => $user, 'year' => $fromYear + 1]);

        if (!$nextYearBalance) {
            $nextYearBalance = $this->initializeYearlyBalance($user, $fromYear + 1);
        }

        $nextYearBalance->setCarriedOverFromPreviousYear($daysToCarryOver);

        $this->entityManager->flush();
    }

    public function getYearlyBalance(User $user, int $year): ?LeaveBalance
    {
        return $this->entityManager->getRepository(LeaveBalance::class)
            ->findOneBy(['user' => $user, 'year' => $year]);
    }

    public function deductLeave(User $user, int $year, int $days, string $leaveType): void
    {
        $balance = $this->getYearlyBalance($user, $year);
        if (!$balance) {
            throw new \RuntimeException("Aucun solde trouvé pour l'année $year");
        }

        if ($leaveType === 'paid') {
            $totalAvailable = $balance->getRemainingPaidLeave() + $balance->getCarriedOverFromPreviousYear();
            if ($days > $totalAvailable) {
                throw new \RuntimeException("Solde insuffisant");
            }

            // D'abord utiliser les jours reportés
            $fromCarriedOver = min($days, $balance->getCarriedOverFromPreviousYear());
            $fromCurrent = $days - $fromCarriedOver;

            $balance->setCarriedOverFromPreviousYear($balance->getCarriedOverFromPreviousYear() - $fromCarriedOver);
            $balance->setRemainingPaidLeave($balance->getRemainingPaidLeave() - $fromCurrent);
        } else {
            if ($days > $balance->getRemainingSickLeave()) {
                throw new \RuntimeException("Solde de congés maladie insuffisant");
            }
            $balance->setRemainingSickLeave($balance->getRemainingSickLeave() - $days);
        }

        $this->entityManager->flush();
    }
} 