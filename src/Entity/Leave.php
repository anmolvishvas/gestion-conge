<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\LeaveRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Serializer\Annotation\Context;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;

#[ORM\Entity(repositoryClass: LeaveRepository::class)]
#[ORM\Table(name: '`leave`')]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(),
        new Post(),
        new Put(),
        new Delete()
    ],
    normalizationContext: ['groups' => ['leave:read']],
    denormalizationContext: ['groups' => ['leave:write']]
)]
#[ApiFilter(SearchFilter::class, properties: ['user' => 'exact'])]
#[ORM\HasLifecycleCallbacks]
class Leave
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['leave:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['leave:read', 'leave:write'])]
    private ?User $user = null;

    #[ORM\Column(length: 50)]
    #[Groups(['leave:read', 'leave:write'])]
    private ?string $type = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['leave:read', 'leave:write'])]
    #[Context([DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['leave:read', 'leave:write'])]
    #[Context([DateTimeNormalizer::FORMAT_KEY => 'Y-m-d'])]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\Column(type: Types::JSON)]
    #[Groups(['leave:read', 'leave:write'])]
    private array $halfDayOptions = [];

    #[ORM\Column(length: 20)]
    #[Groups(['leave:read', 'leave:write'])]
    private ?string $status = 'En attente';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['leave:read', 'leave:write'])]
    private ?string $reason = null;

    #[ORM\Column(type: Types::STRING, nullable: true)]
    #[Groups(['leave:read', 'leave:write'])]
    private ?string $certificate = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 4, scale: 1)]
    #[Groups(['leave:read', 'leave:write'])]
    private ?float $totalDays = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['leave:read'])]
    #[Context([DateTimeNormalizer::FORMAT_KEY => 'Y-m-d\TH:i:s'])]
    private ?\DateTimeInterface $createdAt;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['leave:read'])]
    #[Context([DateTimeNormalizer::FORMAT_KEY => 'Y-m-d\TH:i:s'])]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

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

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): self
    {
        $this->type = $type;
        return $this;
    }

    public function getStartDate(): ?\DateTimeInterface
    {
        return $this->startDate;
    }

    public function setStartDate(\DateTimeInterface $startDate): self
    {
        // S'assurer que la date est au début de la journée
        $date = new \DateTime($startDate->format('Y-m-d'));
        $this->startDate = $date;
        return $this;
    }

    public function getEndDate(): ?\DateTimeInterface
    {
        return $this->endDate;
    }

    public function setEndDate(\DateTimeInterface $endDate): self
    {
        // S'assurer que la date est au début de la journée
        $date = new \DateTime($endDate->format('Y-m-d'));
        $this->endDate = $date;
        return $this;
    }

    public function getHalfDayOptions(): array
    {
        return $this->halfDayOptions;
    }

    public function setHalfDayOptions(array $halfDayOptions): self
    {
        $this->halfDayOptions = $halfDayOptions;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function getReason(): ?string
    {
        return $this->reason;
    }

    public function setReason(?string $reason): self
    {
        $this->reason = $reason;
        return $this;
    }

    public function getCertificate(): ?string
    {
        return $this->certificate;
    }

    public function setCertificate(?string $certificate): self
    {
        $this->certificate = $certificate;
        return $this;
    }

    public function getTotalDays(): ?float
    {
        return $this->totalDays;
    }

    public function setTotalDays(float $totalDays): self
    {
        $this->totalDays = $totalDays;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeInterface $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTime();
    }
} 