const ERROR_TRANSLATIONS: Record<string, string> = {
  Unauthorized: "Требуется повторный вход в систему",
  "Invalid credentials": "Неверный логин или пароль",
  "User is blocked": "Пользователь заблокирован",
  "Username already exists": "Пользователь с таким логином уже существует",
  "Current password is incorrect": "Текущий пароль указан неверно",
  "User not found": "Пользователь не найден",
  "Driver not found": "Водитель не найден",
  "Mechanic not found": "Механик не найден",
  "Vehicle not found": "Транспорт не найден",
  "Fleet vehicle not found": "Техника не найдена",
  "Service event not found": "Заявка не найдена",
  "Site not found": "Объект не найден",
  "Title is required": "Укажите название",
  "Defect description is required": "Опишите дефект",
  "Work log title is required": "Укажите название выполненной работы",
  "User is already assigned as a driver": "Пользователь уже назначен водителем",
  "User is already assigned as a mechanic": "Пользователь уже назначен механиком",
  "Mechanics cannot create repair requests": "Механики не могут создавать заявки на ремонт",
  "Drivers can create repair requests only": "Водители могут создавать только заявки на ремонт",
  "Forbidden resource": "Недостаточно прав для выполнения действия",
}

const PARTIAL_ERROR_TRANSLATIONS: [string, string][] = [
  ["Unauthorized", "Требуется повторный вход в систему"],
  ["Forbidden", "Недостаточно прав для выполнения действия"],
  ["Failed to fetch", "Сервер недоступен"],
  ["NetworkError", "Ошибка сети"],
]

export function translateErrorMessage(message: string) {
  const trimmed = message.trim()
  if (!trimmed) return trimmed

  const exact = ERROR_TRANSLATIONS[trimmed]
  if (exact) return exact

  const partial = PARTIAL_ERROR_TRANSLATIONS.find(([token]) =>
    trimmed.includes(token)
  )
  return partial ? partial[1] : trimmed
}

export function getErrorMessage(error: unknown, fallback = "Произошла ошибка") {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : ""

  return message ? translateErrorMessage(message) : fallback
}
