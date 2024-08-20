export type SmsResponse = {
  success: boolean;
  result?: {
    id: string;
    code: string;
  };
  error?: {
    code: number;
    descr: string;
  };
};

export type CheckResponse = {
  success: boolean;
  error: {
    code: number;
    descr: string;
  };
  result: any;
};
