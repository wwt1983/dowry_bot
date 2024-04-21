import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

@Injectable()
export class AirtableHttpService {
  constructor(private readonly httpService: HttpService) {
    //
  }
  get<T>(url: string): Observable<AxiosResponse<T>> {
    try {
      const response = this.httpService.get(url);
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  getAllWebhook(): void {}
}
