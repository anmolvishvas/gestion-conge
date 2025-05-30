export interface Holiday {
    id: number;
    date: string;
    name: string;
}

export interface HolidayCollection {
    member: Holiday[];
} 