<?php

namespace App\Repository;

use App\Entity\User;
use App\Entity\LeaveBalance;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<LeaveBalance>
 */
class LeaveBalanceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LeaveBalance::class);
    }

    /**
     * Trouve le solde de congés d'un utilisateur pour une année donnée
     */
    public function findUserBalanceForYear(User $user, int $year): ?LeaveBalance
    {
        return $this->createQueryBuilder('lb')
            ->andWhere('lb.user = :user')
            ->andWhere('lb.year = :year')
            ->setParameter('user', $user)
            ->setParameter('year', $year)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Trouve tous les soldes de congés d'un utilisateur
     */
    public function findAllUserBalances(User $user): array
    {
        return $this->createQueryBuilder('lb')
            ->andWhere('lb.user = :user')
            ->setParameter('user', $user)
            ->orderBy('lb.year', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve tous les soldes de congés pour une année donnée
     */
    public function findAllBalancesForYear(int $year): array
    {
        return $this->createQueryBuilder('lb')
            ->andWhere('lb.year = :year')
            ->setParameter('year', $year)
            ->leftJoin('lb.user', 'u')
            ->addSelect('u')
            ->orderBy('u.firstName', 'ASC')
            ->addOrderBy('u.lastName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les utilisateurs qui ont des congés reportés pour une année donnée
     */
    public function findUsersWithCarriedOverLeaves(int $year): array
    {
        return $this->createQueryBuilder('lb')
            ->andWhere('lb.year = :year')
            ->andWhere('lb.carriedOverFromPreviousYear > 0')
            ->setParameter('year', $year)
            ->leftJoin('lb.user', 'u')
            ->addSelect('u')
            ->orderBy('u.firstName', 'ASC')
            ->addOrderBy('u.lastName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les utilisateurs qui ont prévu de reporter des congés sur l'année suivante
     */
    public function findUsersWithLeavesToCarryOver(int $year): array
    {
        return $this->createQueryBuilder('lb')
            ->andWhere('lb.year = :year')
            ->andWhere('lb.carriedOverToNextYear > 0')
            ->setParameter('year', $year)
            ->leftJoin('lb.user', 'u')
            ->addSelect('u')
            ->orderBy('u.firstName', 'ASC')
            ->addOrderBy('u.lastName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les utilisateurs qui ont un solde de congés payés faible (< seuil)
     */
    public function findUsersWithLowPaidLeaveBalance(int $year, int $threshold = 5): array
    {
        return $this->createQueryBuilder('lb')
            ->andWhere('lb.year = :year')
            ->andWhere('(lb.remainingPaidLeave + lb.carriedOverFromPreviousYear) < :threshold')
            ->setParameter('year', $year)
            ->setParameter('threshold', $threshold)
            ->leftJoin('lb.user', 'u')
            ->addSelect('u')
            ->orderBy('lb.remainingPaidLeave', 'ASC')
            ->addOrderBy('u.firstName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Vérifie si un utilisateur a déjà un solde pour une année donnée
     */
    public function hasBalanceForYear(User $user, int $year): bool
    {
        $count = $this->createQueryBuilder('lb')
            ->select('COUNT(lb.id)')
            ->andWhere('lb.user = :user')
            ->andWhere('lb.year = :year')
            ->setParameter('user', $user)
            ->setParameter('year', $year)
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }

    /**
     * Calcule le total des jours reportés sur l'année suivante pour une année donnée
     */
    public function getTotalCarriedOverDaysForYear(int $year): int
    {
        $result = $this->createQueryBuilder('lb')
            ->select('SUM(lb.carriedOverToNextYear)')
            ->andWhere('lb.year = :year')
            ->setParameter('year', $year)
            ->getQuery()
            ->getSingleScalarResult();

        return (int) $result;
    }
} 