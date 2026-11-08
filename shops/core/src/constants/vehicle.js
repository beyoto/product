export const VEHICLE_OPTIONS = {
  transmission: [['automatic', 'Автомат'], ['manual', 'Механика'], ['robot', 'Робот'], ['cvt', 'Вариатор']],
  fuel: [['petrol', 'Бензин'], ['diesel', 'Дизель'], ['gas', 'Газ'], ['hybrid', 'Гибрид'], ['electric', 'Электро']],
  drive: [['fwd', 'Передний'], ['rwd', 'Задний'], ['awd', 'Полный']],
  steering: [['left', 'Левый руль'], ['right', 'Правый руль']],
  condition: [['new', 'Новый'], ['used', 'С пробегом']],
};

export const vehicleLabel = (field, value) => VEHICLE_OPTIONS[field]?.find(([key]) => key === value)?.[1] || value;
