<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\LeaveBalanceRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: LeaveBalanceRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Put()
    ],
    normalizationContext: ['groups' => ['leave_balance:read']],
    denormalizationContext: ['groups' => ['leave_balance:write']]
)]
class LeaveBalance
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['leave_balance:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['leave_balance:read', 'leave_balance:write'])]
    private ?User $user = null;

    #[ORM\Column]
    #[Groups(['leave_balance:read', 'leave_balance:write'])]
    private ?int $year = null;

    #[ORM\Column]
    #[Groups(['leave_balance:read', 'leave_balance:write'])]
    private ?int $initialPaidLeave = 22;  // Solde initial de congés payés

    #[ORM\Column]
    #[Groups(['leave_balance:read', 'leave_balance:write'])]
    private ?int $initialSickLeave = 15;  // Solde initial de congés maladie

    #[ORM\Column]
    #[Groups(['leave_balance:read', 'leave_balance:write'])]
    private ?int $remainingPaidLeave = 22;  // Solde restant de congés payés

    #[ORM\Column]
    #[Groups(['leave_balance:read', 'leave_balance:write'])]
    private ?int $remainingSickLeave = 15;  // Solde restant de congés maladie

    #[ORM\Column]
    #[Groups(['leave_balance:read', 'leave_balance:write'])]
    private ?int $carriedOverFromPreviousYear = 0;  // Congés reportés de l'année précédente

    #[ORM\Column]
    #[Groups(['leave_balance:read', 'leave_balance:write'])]
    private ?int $carriedOverToNextYear = 0;  // Congés à reporter sur l'année suivante

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;
        return $this;
    }

    public function getYear(): ?int
    {
        return $this->year;
    }

    public function setYear(int $year): self
    {
        $this->year = $year;
        return $this;
    }

    public function getInitialPaidLeave(): ?int
    {
        return $this->initialPaidLeave;
    }

    public function setInitialPaidLeave(int $initialPaidLeave): self
    {
        $this->initialPaidLeave = $initialPaidLeave;
        return $this;
    }

    public function getInitialSickLeave(): ?int
    {
        return $this->initialSickLeave;
    }

    public function setInitialSickLeave(int $initialSickLeave): self
    {
        $this->initialSickLeave = $initialSickLeave;
        return $this;
    }

    public function getRemainingPaidLeave(): ?int
    {
        return $this->remainingPaidLeave;
    }

    public function setRemainingPaidLeave(int $remainingPaidLeave): self
    {
        $this->remainingPaidLeave = $remainingPaidLeave;
        return $this;
    }

    public function getRemainingSickLeave(): ?int
    {
        return $this->remainingSickLeave;
    }

    public function setRemainingSickLeave(int $remainingSickLeave): self
    {
        $this->remainingSickLeave = $remainingSickLeave;
        return $this;
    }

    public function getCarriedOverFromPreviousYear(): ?int
    {
        return $this->carriedOverFromPreviousYear;
    }

    public function setCarriedOverFromPreviousYear(int $carriedOverFromPreviousYear): self
    {
        $this->carriedOverFromPreviousYear = $carriedOverFromPreviousYear;
        return $this;
    }

    public function getCarriedOverToNextYear(): ?int
    {
        return $this->carriedOverToNextYear;
    }

    public function setCarriedOverToNextYear(int $carriedOverToNextYear): self
    {
        $this->carriedOverToNextYear = $carriedOverToNextYear;
        return $this;
    }

    public function getTotalPaidLeaveAvailable(): int
    {
        return $this->remainingPaidLeave + $this->carriedOverFromPreviousYear;
    }
} 