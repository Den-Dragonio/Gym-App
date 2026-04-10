import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays,
  setYear,
  getYear
} from 'date-fns';
import { enUS, ru, uk } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Activity, Zap, Shield, Dumbbell } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import './CalendarWidget.css';

export interface CompletedDay {
  date: string; // 'YYYY-MM-DD'
  type: 'Cardio' | 'Arms' | 'Legs' | 'Back' | 'Chest' | 'Full Body' | 'Other';
}

interface CalendarWidgetProps {
  onDateSelect: (date: Date) => void;
  completedDays?: CompletedDay[];
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ onDateSelect, completedDays = [] }) => {
  const { language } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'year'>('month');

  const localeMap = { en: enUS, ru: ru, ua: uk };
  const currentLocale = localeMap[language];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    onDateSelect(day);
  };

  const handleMonthClick = () => {
    setView('year');
  };

  const selectYear = (year: number) => {
    setCurrentDate(setYear(currentDate, year));
    setView('month');
  };

  const renderHeader = () => {
    return (
      <div className="calendar-header">
        <button onClick={prevMonth} className="icon-btn"><ChevronLeft size={20}/></button>
        <div className="calendar-month-year" onClick={handleMonthClick}>
          <span>{format(currentDate, 'LLLL yyyy', { locale: currentLocale })}</span>
        </div>
        <button onClick={nextMonth} className="icon-btn"><ChevronRight size={20}/></button>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = 'cccccc';
    const days = [];
    let startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="calendar-day-name" key={i}>
          {format(addDays(startDate, i), dateFormat, { locale: currentLocale })}
        </div>
      );
    }
    return <div className="calendar-days-row">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dateString = format(day, 'yyyy-MM-dd');
        const completedRecord = completedDays.find(d => d.date === dateString);

        let typeIcon = null;
        let typeClass = '';
        if (completedRecord) {
           switch (completedRecord.type) {
             case 'Cardio': typeIcon = <Activity size={12}/>; typeClass = 'type-cardio'; break;
             case 'Full Body': typeIcon = <Zap size={12}/>; typeClass = 'type-full'; break;
             case 'Arms': typeIcon = <Dumbbell size={12}/>; typeClass = 'type-arms'; break;
             case 'Legs': typeIcon = <Shield size={12}/>; typeClass = 'type-legs'; break;
             case 'Back': typeIcon = <Shield size={12}/>; typeClass = 'type-back'; break;
             case 'Chest': typeIcon = <Shield size={12}/>; typeClass = 'type-chest'; break;
             default: typeIcon = '🔥'; typeClass = 'type-other'; break;
           }
        }

        days.push(
          <div
            className={`calendar-cell ${
              !isSameMonth(day, monthStart)
                ? 'disabled'
                : isSameDay(day, selectedDate)
                ? 'selected'
                : ''
            } ${isSameDay(day, new Date()) ? 'today' : ''} ${completedRecord ? 'completed ' + typeClass : ''}`}
            key={day.toString()}
            onClick={() => handleDateClick(cloneDay)}
          >
            <span className="number">{format(day, 'd')}</span>
            {completedRecord && <div className="fire-indicator">{typeIcon}</div>}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="calendar-row" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="calendar-grid">{rows}</div>;
  };

  const renderYearSelector = () => {
    const currentYear = getYear(currentDate);
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(
        <button 
          key={i} 
          className={`year-btn ${currentYear === i ? 'active' : ''}`}
          onClick={() => selectYear(i)}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="year-selector">
        <div className="year-grid">{years}</div>
        <button className="btn-secondary" onClick={() => setView('month')}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="calendar">
      {view === 'month' ? (
        <>
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </>
      ) : (
        renderYearSelector()
      )}
    </div>
  );
};
