export interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface FormData {
  category: string;
  title: string;
  description: string;
}

export interface User {
  id: string;
  username: string;
  dept: string;
}
