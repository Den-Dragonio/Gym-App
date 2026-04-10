import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface ChartPoint {
  date: string;
  weight?: number;
  bench?: number;
  squat?: number;
  deadlift?: number;
}

export const ProgressChart = ({ data }: { data: ChartPoint[] }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)' }}>
        {t('no_data_chart', 'No data to display yet. Log some workouts!')}
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="var(--color-text-tertiary)" 
            fontSize={12} 
            tickFormatter={(str) => {
                const date = new Date(str);
                return `${date.getDate()}.${date.getMonth() + 1}`;
            }}
          />
          <YAxis stroke="var(--color-text-tertiary)" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
                backgroundColor: 'var(--color-bg-card)', 
                borderColor: 'var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)'
            }} 
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
          
          <Line 
            name={t('weight', 'Weight')} 
            type="monotone" 
            dataKey="weight" 
            stroke="var(--color-primary)" 
            strokeWidth={2} 
            dot={{ r: 3 }} 
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line 
            name={t('bench_press', 'Bench')} 
            type="monotone" 
            dataKey="bench" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={{ r: 3 }} 
            connectNulls
          />
          <Line 
            name={t('squat', 'Squat')} 
            type="monotone" 
            dataKey="squat" 
            stroke="#10b981" 
             strokeWidth={2} 
            dot={{ r: 3 }} 
            connectNulls
          />
          <Line 
            name={t('deadlift', 'Deadlift')} 
            type="monotone" 
            dataKey="deadlift" 
            stroke="#f59e0b" 
            strokeWidth={2} 
            dot={{ r: 3 }} 
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
