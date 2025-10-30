
import React from 'react';
import type { ChurchEvent } from '../types';
import { CalendarIcon } from './icons';

interface EventCardProps {
  event: ChurchEvent;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const eventDate = new Date(event.date);
  const day = eventDate.toLocaleDateString('en-US', { day: '2-digit' });
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 w-full">
      <div className="flex">
        <div className="flex flex-col items-center justify-center bg-blue-500 text-white p-4 w-24">
          <span className="text-3xl font-bold">{day}</span>
          <span className="text-sm font-semibold">{month}</span>
        </div>
        <div className="p-4 flex-1">
          <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{event.time} @ {event.location}</p>
          <p className="text-sm text-gray-500 mt-2 truncate">{event.description}</p>
        </div>
      </div>
    </div>
  );
};
