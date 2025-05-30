import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    Calendar,
    Clock,
    CheckCircle,
    CalendarDays,
    UserPlus,
    FileText,
    ArrowRightLeft
} from 'lucide-react';

const navigation = [
    {
        name: 'Tableau de bord',
        path: '/admin/dashboard',
        icon: <LayoutDashboard className="h-6 w-6" />
    },
    {
        name: 'Employés',
        path: '/admin/employees',
        icon: <Users className="h-6 w-6" />
    },
    {
        name: 'Détails des absences',
        path: '/admin/employee-absences',
        icon: <FileText className="h-6 w-6" />
    },
    {
        name: 'Congés',
        path: '/admin/leaves',
        icon: <Calendar className="h-6 w-6" />
    },
    {
        name: 'Report des congés',
        path: '/admin/leaves/carryover',
        icon: <ArrowRightLeft className="h-6 w-6" />
    },
    {
        name: 'Présence quotidienne',
        path: '/admin/presence',
        icon: <Clock className="h-6 w-6" />
    },
    {
        name: 'Approbations en attente',
        path: '/admin/approvals',
        icon: <CheckCircle className="h-6 w-6" />
    },
    {
        name: 'Jours fériés',
        path: '/admin/holidays',
        icon: <CalendarDays className="h-6 w-6" />
    }
];

const AdminSidebar = () => {
    return (
        <nav className="space-y-1">
            {navigation.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            isActive
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                    }
                >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default AdminSidebar; 