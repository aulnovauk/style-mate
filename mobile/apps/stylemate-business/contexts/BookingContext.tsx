import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  image: string;
  visits: number;
  lastVisit: string;
  tag?: 'VIP' | 'Regular' | 'New';
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  icon: string;
  iconColor: string;
  staffId?: string;
  staffName?: string;
  tag?: 'Trending' | 'Popular' | 'Premium';
}

export interface StaffMember {
  id: string;
  name: string;
  image: string;
  role: string;
  rating: number;
  reviews: number;
  available: boolean;
  nextAvailable?: string;
}

export interface BookingData {
  client: Client | null;
  services: Service[];
  selectedDate: Date | null;
  selectedTime: string | null;
  staff: StaffMember | null;
  paymentMethod: 'cash' | 'card' | 'upi';
  notes: string;
  reminders: {
    push: boolean;
    sms: boolean;
    email: boolean;
  };
}

interface BookingContextType {
  currentStep: number;
  bookingData: BookingData;
  setCurrentStep: (step: number) => void;
  setClient: (client: Client | null) => void;
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  updateServiceStaff: (serviceId: string, staffId: string, staffName: string) => void;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: string | null) => void;
  setStaff: (staff: StaffMember | null) => void;
  setPaymentMethod: (method: 'cash' | 'card' | 'upi') => void;
  setNotes: (notes: string) => void;
  setReminders: (reminders: { push: boolean; sms: boolean; email: boolean }) => void;
  getTotalPrice: () => number;
  getTotalDuration: () => number;
  resetBooking: () => void;
}

const initialBookingData: BookingData = {
  client: null,
  services: [],
  selectedDate: null,
  selectedTime: null,
  staff: null,
  paymentMethod: 'cash',
  notes: '',
  reminders: {
    push: true,
    sms: true,
    email: false,
  },
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);

  const setClient = (client: Client | null) => {
    setBookingData((prev) => ({ ...prev, client }));
  };

  const addService = (service: Service) => {
    setBookingData((prev) => ({
      ...prev,
      services: [...prev.services, service],
    }));
  };

  const removeService = (serviceId: string) => {
    setBookingData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== serviceId),
    }));
  };

  const updateServiceStaff = (serviceId: string, staffId: string, staffName: string) => {
    setBookingData((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId ? { ...s, staffId, staffName } : s
      ),
    }));
  };

  const setSelectedDate = (date: Date | null) => {
    setBookingData((prev) => ({ ...prev, selectedDate: date }));
  };

  const setSelectedTime = (time: string | null) => {
    setBookingData((prev) => ({ ...prev, selectedTime: time }));
  };

  const setStaff = (staff: StaffMember | null) => {
    setBookingData((prev) => ({ ...prev, staff }));
  };

  const setPaymentMethod = (method: 'cash' | 'card' | 'upi') => {
    setBookingData((prev) => ({ ...prev, paymentMethod: method }));
  };

  const setNotes = (notes: string) => {
    setBookingData((prev) => ({ ...prev, notes }));
  };

  const setReminders = (reminders: { push: boolean; sms: boolean; email: boolean }) => {
    setBookingData((prev) => ({ ...prev, reminders }));
  };

  const getTotalPrice = () => {
    return bookingData.services.reduce((sum, service) => sum + service.price, 0);
  };

  const getTotalDuration = () => {
    return bookingData.services.reduce((sum, service) => sum + service.duration, 0);
  };

  const resetBooking = () => {
    setCurrentStep(1);
    setBookingData(initialBookingData);
  };

  return (
    <BookingContext.Provider
      value={{
        currentStep,
        bookingData,
        setCurrentStep,
        setClient,
        addService,
        removeService,
        updateServiceStaff,
        setSelectedDate,
        setSelectedTime,
        setStaff,
        setPaymentMethod,
        setNotes,
        setReminders,
        getTotalPrice,
        getTotalDuration,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
