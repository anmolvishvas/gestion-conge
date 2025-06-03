<?php

namespace App\Service;

use App\Repository\HolidayRepository;

class LeaveCalculator
{
    private HolidayRepository $holidayRepository;

    public function __construct(HolidayRepository $holidayRepository)
    {
        $this->holidayRepository = $holidayRepository;
    }

    public function calculateTotalDays(\DateTimeInterface $startDate, \DateTimeInterface $endDate, array $halfDayOptions): float
    {
        $holidays = $this->holidayRepository->findHolidaysBetweenDates($startDate, $endDate);
        $holidayDates = array_map(function($holiday) {
            return $holiday->getDate()->format('Y-m-d');
        }, $holidays);

        $totalDays = 0;
        $currentDate = clone $startDate;

        while ($currentDate <= $endDate) {
            $dateString = $currentDate->format('Y-m-d');
            $dayOfWeek = (int)$currentDate->format('N');

            if ($dayOfWeek < 6 && !in_array($dateString, $holidayDates)) {
                $option = $this->findHalfDayOption($dateString, $halfDayOptions);

                if ($option) {
                    if ($option['type'] === 'FULL') {
                        $totalDays += 1;
                    } elseif ($option['type'] === 'AM' || $option['type'] === 'PM') {
                        $totalDays += 0.5;
                    }
                } else {
                    $totalDays += 1;
                }
            }

            $currentDate->modify('+1 day');
        }

        return $totalDays;
    }

    private function findHalfDayOption(string $date, array $halfDayOptions): ?array
    {
        foreach ($halfDayOptions as $option) {
            if ($option['date'] === $date) {
                return $option;
            }
        }

        return null;
    }
} 