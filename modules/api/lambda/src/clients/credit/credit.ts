import axios from 'axios';
import * as qs from 'qs';
import { parseString } from 'xml2js';
import { TCreditMember } from './types';

class CreditService {
  static partnerCode = process.env.PARTNER_CODE;
  static partnerPass = process.env.PARTNER_PASS;
  static baseUrl = 'https://api.idandcredit.com/api';

  static xmlToJson(xml: any) {
    return new Promise((resolve, reject) => {
      parseString(xml, (error: any, result: any) =>
        error ? reject(error) : resolve(result)
      );
    });
  }

  static async enroll(data: TCreditMember): Promise<any> {
    try {
      const newMember: any = await CreditService.callApi(this.baseUrl + '/enroll', { ...data, branding: this.partnerCode });
      console.log('idCreditServices enroll', newMember)
      return newMember;
    } catch (error) {
      throw new Error(`Failed to enroll in IDCreditServices: ${error.message || error}`);
    }
  }
  static async callApi(url: string, requestData: any, rawResult?: any) {
    const formData = { 
      ...requestData,
      partnerCode: this.partnerCode,
      partnerPass: this.partnerPass
    }
    const { data }: { data: any } = await axios.post(
      url,
      qs.stringify(formData),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    if (rawResult) {
      return data;
    }
    const parsedData = (await this.xmlToJson(data)) as any
    console.debug('[CreditService]: callApi result: ', parsedData)
    const {
      Response: {
        ErrorCode: errorCode,
        ErrorMessage: errorMessage,
        ...result
      },
    } = parsedData;
    if (errorMessage || errorCode) {
      console.debug('[CreditService]: Error calling api', errorCode, errorMessage)
      throw new Error(`${errorCode} ${errorMessage}`);
    }
    return result;
  }
}

export default CreditService;
