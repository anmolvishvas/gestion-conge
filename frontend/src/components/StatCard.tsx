import  { MouseEventHandler } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  available?: number;
  icon: React.ReactNode;
  color: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const StatCard = ({ title, value, available, icon, color, onClick }: StatCardProps) => {
  return (
    <div 
      className={`card transition-transform duration-200 ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="p-6 flex items-center">
        <div className={`${color} rounded-lg p-3 flex items-center justify-center mr-4`}>
          {icon}
        </div>
        <div className="flex-grow">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="flex items-baseline">
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
            {available !== undefined && (
              <span className="text-sm text-gray-600 ml-2">/ {available}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
 