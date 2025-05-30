<?php

namespace App\Controller\Api;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Post;

#[Route('/api')]
class AuthController extends AbstractController
{
    #[Route('/login', name: 'api_login', methods: ['POST'])]
    public function login(Request $request, UserRepository $userRepository): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!isset($data['email']) || !isset($data['password'])) {
                return $this->json([
                    'message' => 'Email and password are required'
                ], 400);
            }

            $user = $userRepository->findOneBy(['email' => $data['email']]);

            if (!$user || $user->getPassword() !== $data['password']) {
                return $this->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }

            if ($user->getStatus() !== 'active') {
                return $this->json([
                    'message' => 'User account is not active'
                ], 401);
            }

            return $this->json([
                'user' => [
                    'id' => $user->getId(),
                    'firstName' => $user->getFirstName(),
                    'lastName' => $user->getLastName(),
                    'email' => $user->getEmail(),
                    'phone' => $user->getPhone(),
                    'trigram' => $user->getTrigram(),
                    'status' => $user->getStatus(),
                    'paidLeaveBalance' => $user->getPaidLeaveBalance(),
                    'sickLeaveBalance' => $user->getSickLeaveBalance(),
                    'startDate' => $user->getStartDate()->format('Y-m-d'),
                    'endDate' => $user->getEndDate() ? $user->getEndDate()->format('Y-m-d') : null,
                    'isAdmin' => $user->isAdmin()
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Une erreur est survenue lors de la connexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 