<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Psr\Log\LoggerInterface;

#[AsCommand(
    name: 'app:test-email',
    description: 'Test email sending functionality',
)]
class TestEmailCommand extends Command
{
    public function __construct(
        private MailerInterface $mailer,
        private LoggerInterface $logger
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        try {
            $output->writeln('Attempting to send test email...');
            
            $email = (new Email())
                ->from('no-reply@sydev.com')
                ->to('anmol.vishvas@sydev.com')
                ->subject('Test Email from Symfony')
                ->text('This is a test email to verify the email sending functionality.')
                ->html('<p>This is a test email to verify the email sending functionality.</p>');

            $this->logger->info('Sending test email', [
                'to' => 'anmol.vishvas@sydev.com'
            ]);

            $this->mailer->send($email);

            $this->logger->info('Test email sent successfully');
            $output->writeln('Test email sent successfully!');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->logger->error('Failed to send test email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            $output->writeln('<error>Failed to send test email: ' . $e->getMessage() . '</error>');

            return Command::FAILURE;
        }
    }
} 