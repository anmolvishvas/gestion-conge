<?php

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Psr\Log\LoggerInterface;

class EmailService
{
    private MailerInterface $mailer;
    private LoggerInterface $logger;

    public function __construct(
        MailerInterface $mailer,
        LoggerInterface $logger
    ) {
        $this->mailer = $mailer;
        $this->logger = $logger;
    }

    /**
     * @throws \Exception
     */
    public function sendEmail(
        string $emailAuthor,
        string $emailRecipient,
        ?string $emailCopyRecipient,
        string $subject,
        string $body,
        ?array $attachments = null
    ): bool {
        try {
            $this->logger->info('Creating email', [
                'from' => $emailAuthor,
                'to' => $emailRecipient,
                'subject' => $subject
            ]);

            $email = new Email();
            $email->from($emailAuthor)
                ->subject($subject)
                ->text(strip_tags($body))
                ->html($body);

            $recipients = array_map('trim', explode(';', $emailRecipient));
            foreach ($recipients as $recipient) {
                if (!empty($recipient)) {
                    $email->addTo($recipient);
                }
            }

            if (!empty($emailCopyRecipient)) {
                $ccRecipients = array_map('trim', explode(';', $emailCopyRecipient));
                foreach ($ccRecipients as $ccRecipient) {
                    if (!empty($ccRecipient)) {
                        $email->addCc($ccRecipient);
                    }
                }
            }

            if ($attachments !== null) {
                foreach ($attachments as $attachment) {
                    try {
                        if (empty($attachment['attachment']) || !str_contains($attachment['attachment'], ',')) {
                            continue;
                        }

                        $base64Content = explode(',', $attachment['attachment'])[1];
                        $fileContent = base64_decode($base64Content);
                        
                        if ($fileContent === false) {
                            throw new \Exception('Invalid base64 content');
                        }

                        $fileName = !empty($attachment['name']) ? $attachment['name'] : 'Rapport.pdf';
                        
                        $tmpPath = sys_get_temp_dir() . '/' . uniqid() . $fileName;
                        file_put_contents($tmpPath, $fileContent);
                        
                        $email->attachFromPath($tmpPath, $fileName, 'application/pdf');
                        
                        unlink($tmpPath);
                    } catch (\Exception $ex) {
                        throw new BadRequestHttpException("Error attaching file {$attachment['name']}: " . $ex->getMessage());
                    }
                }
            }

            $this->logger->info('Sending email via mailer');
            $this->mailer->send($email);
            $this->logger->info('Email sent successfully');
            return true;
        } catch (\Exception $e) {
            $this->logger->error('Failed to send email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw new \Exception('Failed to send email: ' . $e->getMessage());
        }
    }
} 