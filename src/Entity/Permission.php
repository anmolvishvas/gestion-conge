<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\PermissionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: PermissionRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Post(),
        new Get(),
        new Put(),
        new Delete()
    ],
    normalizationContext: ['groups' => ['permission:read']],
    denormalizationContext: ['groups' => ['permission:write']]
)]
#[ApiFilter(SearchFilter::class, properties: ['user' => 'exact'])]
class Permission
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['permission:read', 'permission:write', 'replacement_slot:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'permissions')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['permission:read', 'permission:write'])]
    private ?User $user = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['permission:read', 'permission:write', 'replacement_slot:read'])]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(type: Types::TIME_MUTABLE)]
    #[Groups(['permission:read', 'permission:write', 'replacement_slot:read'])]
    private ?\DateTimeInterface $startTime = null;

    #[ORM\Column(type: Types::TIME_MUTABLE)]
    #[Groups(['permission:read', 'permission:write', 'replacement_slot:read'])]
    private ?\DateTimeInterface $endTime = null;

    #[ORM\Column]
    #[Groups(['permission:read', 'permission:write', 'replacement_slot:read'])]
    private ?int $durationMinutes = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['permission:read', 'permission:write', 'replacement_slot:read'])]
    private ?string $reason = null;

    #[ORM\Column(length: 255)]
    #[Groups(['permission:read', 'permission:write', 'replacement_slot:read'])]
    private ?string $status = null;

    #[ORM\OneToMany(targetEntity: ReplacementSlot::class, mappedBy: 'permission', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['permission:read', 'permission:write'])]
    private Collection $replacementSlots;

    public function __construct()
    {
        $this->replacementSlots = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = $date;
        return $this;
    }

    public function getStartTime(): ?\DateTimeInterface
    {
        return $this->startTime;
    }

    public function setStartTime(\DateTimeInterface $startTime): static
    {
        $this->startTime = $startTime;
        return $this;
    }

    public function getEndTime(): ?\DateTimeInterface
    {
        return $this->endTime;
    }

    public function setEndTime(\DateTimeInterface $endTime): static
    {
        $this->endTime = $endTime;
        return $this;
    }

    public function getDurationMinutes(): ?int
    {
        return $this->durationMinutes;
    }

    public function setDurationMinutes(int $durationMinutes): static
    {
        $this->durationMinutes = $durationMinutes;
        return $this;
    }

    public function getReason(): ?string
    {
        return $this->reason;
    }

    public function setReason(string $reason): static
    {
        $this->reason = $reason;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    /**
     * @return Collection<int, ReplacementSlot>
     */
    public function getReplacementSlots(): Collection
    {
        return $this->replacementSlots;
    }

    public function addReplacementSlot(ReplacementSlot $replacementSlot): static
    {
        if (!$this->replacementSlots->contains($replacementSlot)) {
            $this->replacementSlots->add($replacementSlot);
            $replacementSlot->setPermission($this);
        }

        return $this;
    }

    public function removeReplacementSlot(ReplacementSlot $replacementSlot): static
    {
        if ($this->replacementSlots->removeElement($replacementSlot)) {
            // set the owning side to null (unless already changed)
            if ($replacementSlot->getPermission() === $this) {
                $replacementSlot->setPermission(null);
            }
        }

        return $this;
    }

    public function __toString(): string
    {
        return sprintf('Permission #%d (%s)', $this->id ?? 0, $this->date?->format('Y-m-d') ?? 'no date');
    }
} 