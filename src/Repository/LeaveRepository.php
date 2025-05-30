<?php

namespace App\Repository;

use App\Entity\Leave;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Leave>
 */
class LeaveRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Leave::class);
    }

    /**
     * Find leaves by user and date range
     */
    public function findByUserAndDateRange(int $userId, \DateTime $startDate, \DateTime $endDate): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.user = :userId')
            ->andWhere('l.startDate <= :endDate')
            ->andWhere('l.endDate >= :startDate')
            ->setParameter('userId', $userId)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->orderBy('l.startDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find pending leaves
     */
    public function findPendingLeaves(): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.status = :status')
            ->setParameter('status', 'En attente')
            ->orderBy('l.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find leaves by user and status
     */
    public function findByUserAndStatus(int $userId, string $status): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.user = :userId')
            ->andWhere('l.status = :status')
            ->setParameter('userId', $userId)
            ->setParameter('status', $status)
            ->orderBy('l.startDate', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find overlapping leaves for a user
     */
    public function findOverlappingLeaves(int $userId, \DateTime $startDate, \DateTime $endDate, ?int $excludeLeaveId = null): array
    {
        $qb = $this->createQueryBuilder('l')
            ->andWhere('l.user = :userId')
            ->andWhere('l.startDate <= :endDate')
            ->andWhere('l.endDate >= :startDate')
            ->andWhere('l.status != :rejectedStatus')
            ->setParameter('userId', $userId)
            ->setParameter('startDate', $startDate)
            ->setParameter('endDate', $endDate)
            ->setParameter('rejectedStatus', 'Rejeté');

        if ($excludeLeaveId) {
            $qb->andWhere('l.id != :excludeLeaveId')
               ->setParameter('excludeLeaveId', $excludeLeaveId);
        }

        return $qb->getQuery()->getResult();
    }
} 