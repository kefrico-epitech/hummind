export interface AccessRequestItem {
  id: string;
  email: string;
  role: string;
  requester?: {
    firstname?: string;
    lastname?: string;
  };
  entity?: {
    name?: string;
    type?: string;
  };
}
