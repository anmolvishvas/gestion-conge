<?php

namespace App\Controller;

use App\Service\EmailService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class EmailController extends AbstractController
{
    private EmailService $emailService;

    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    #[Route('/api/email/send', name: 'api_email_send', methods: ['POST'])]
    public function sendEmail(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (!isset($data['emailAuthor']) || !isset($data['emailRecipient']) || !isset($data['subject']) || !isset($data['body'])) {
                return new JsonResponse(['error' => 'Missing required fields'], Response::HTTP_BAD_REQUEST);
            }

            $success = $this->emailService->sendEmail(
                $data['emailAuthor'],
                $data['emailRecipient'],
                $data['emailCopyRecipient'] ?? null,
                $data['subject'],
                $data['body'],
                $data['attachments'] ?? null
            );

            return new JsonResponse(
                ['message' => 'Email sent successfully'],
                Response::HTTP_ACCEPTED
            );
        } catch (\Exception $e) {
            return new JsonResponse(
                ['error' => $e->getMessage()],
                Response::HTTP_BAD_REQUEST
            );
        }
    }
} 