export interface ITextOverlay {
  [key: string]: any;
}

export interface IParsedResult {
  TextOverlay: ITextOverlay;
  TextOrientation: string;
  FileParseExitCode: number;
  ParsedText: string;
  ErrorMessage: string;
  ErrorDetails: string;
}

export interface IOCRResponse {
  ParsedResults: IParsedResult[];
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ProcessingTimeInMilliseconds: string;
  SearchablePDFURL: string;
}
