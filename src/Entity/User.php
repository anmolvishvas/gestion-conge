<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Post(),
        new Get(),
        new Put(),
        new Delete()
    ],
    normalizationContext: ['groups' => ['user:read']],
    denormalizationContext: ['groups' => ['user:write']]
)]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $firstName = null;

    #[ORM\Column(length: 255)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $lastName = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $email = null;

    #[ORM\Column(length: 20)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $phone = null;

    #[ORM\Column(length: 3)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $trigram = null;

    #[ORM\Column]
    #[Groups(['user:write'])]
    private ?string $password = null;

    #[ORM\Column(length: 20)]
    #[Groups(['user:read', 'user:write'])]
    private ?string $status = null;

    #[ORM\Column(type: 'date')]
    #[Groups(['user:read', 'user:write'])]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['user:read', 'user:write'])]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\Column]
    #[Groups(['user:read', 'user:write'])]
    private ?bool $isAdmin = false;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Permission::class, orphanRemoval: true)]
    #[Groups(['user:read'])]
    private Collection $permissions;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: LeaveBalance::class, orphanRemoval: true)]
    #[Groups(['user:read'])]
    private Collection $leaveBalances;

    // Virtual properties for leave balances
    #[Groups(['user:read'])]
    private ?int $paidLeaveBalance = null;

    #[Groups(['user:read'])]
    private ?int $sickLeaveBalance = null;

    public function __construct()
    {
        $this->permissions = new ArrayCollection();
        $this->leaveBalances = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;
        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(string $phone): static
    {
        $this->phone = $phone;
        return $this;
    }

    public function getTrigram(): ?string
    {
        return $this->trigram;
    }

    public function setTrigram(string $trigram): static
    {
        $this->trigram = $trigram;
        return $this;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
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

    public function getStartDate(): ?\DateTimeInterface
    {
        return $this->startDate;
    }

    public function setStartDate(\DateTimeInterface $startDate): static
    {
        $this->startDate = $startDate;
        return $this;
    }

    public function getEndDate(): ?\DateTimeInterface
    {
        return $this->endDate;
    }

    public function setEndDate(?\DateTimeInterface $endDate): static
    {
        $this->endDate = $endDate;
        return $this;
    }

    public function isAdmin(): ?bool
    {
        return $this->isAdmin;
    }

    public function setIsAdmin(bool $isAdmin): static
    {
        $this->isAdmin = $isAdmin;
        return $this;
    }

    /**
     * @return Collection<int, Permission>
     */
    public function getPermissions(): Collection
    {
        return $this->permissions;
    }

    public function addPermission(Permission $permission): static
    {
        if (!$this->permissions->contains($permission)) {
            $this->permissions->add($permission);
            $permission->setUser($this);
        }

        return $this;
    }

    public function removePermission(Permission $permission): static
    {
        if ($this->permissions->removeElement($permission)) {
            // set the owning side to null (unless already changed)
            if ($permission->getUser() === $this) {
                $permission->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, LeaveBalance>
     */
    public function getLeaveBalances(): Collection
    {
        return $this->leaveBalances;
    }

    public function addLeaveBalance(LeaveBalance $leaveBalance): self
    {
        if (!$this->leaveBalances->contains($leaveBalance)) {
            $this->leaveBalances->add($leaveBalance);
            $leaveBalance->setUser($this);
        }

        return $this;
    }

    public function removeLeaveBalance(LeaveBalance $leaveBalance): self
    {
        if ($this->leaveBalances->removeElement($leaveBalance)) {
            if ($leaveBalance->getUser() === $this) {
                $leaveBalance->setUser(null);
            }
        }

        return $this;
    }

    /**
     * Get the current paid leave balance for the current year
     */
    public function getPaidLeaveBalance(): ?int
    {
        $currentYear = (int)date('Y');
        $currentBalance = $this->getCurrentYearBalance();
        
        if (!$currentBalance) {
            return 0;
        }

        return $currentBalance->getRemainingPaidLeave() + $currentBalance->getCarriedOverFromPreviousYear();
    }

    /**
     * Get the current sick leave balance for the current year
     */
    public function getSickLeaveBalance(): ?int
    {
        $currentYear = (int)date('Y');
        $currentBalance = $this->getCurrentYearBalance();
        
        return $currentBalance ? $currentBalance->getRemainingSickLeave() : 0;
    }

    /**
     * Get the leave balance for the current year
     */
    private function getCurrentYearBalance(): ?LeaveBalance
    {
        $currentYear = (int)date('Y');
        
        foreach ($this->leaveBalances as $balance) {
            if ($balance->getYear() === $currentYear) {
                return $balance;
            }
        }
        
        return null;
    }
} 