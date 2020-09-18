import axios from "axios";
import * as FormData  from 'form-data';

import { TLeadRaw, TLeadResponse } from "./types";

class ZohoService {
  static client_id = process.env.ZOHO_ID;
  static client_secret = process.env.ZOHO_SECRET;
  static access_token = process.env.ZOHO_TOKEN;
  static refresh_token = process.env.ZOHO_REFRESH_TOKEN;
  static lead_url = "https://www.zohoapis.com/crm/v2/Leads/";

  static async findLead(data: TLeadResponse): Promise<any> {
    const options = {
      method: "GET",
      url: ZohoService.lead_url + "search",
      headers: {
        Authorization: "Bearer " + ZohoService.access_token,
      },
      params: {
        criteria: data.id
          ? `id:equals:${data.id}`
          : `Email:equals:${data.Email}`,
      },
    };

    try {
      const lead: any = await ZohoService.callApi(options);
      return lead;
    } catch (error) {
      throw new Error("Failed search");
    }
  }

  static async attachments(data: TLeadRaw): Promise<any> {
    const options = {
      method: "GET",
      url: ZohoService.lead_url + data.id + "/Attachments",
      headers: {
        Authorization: "Bearer " + ZohoService.access_token,
      },
    };

    try {
      //@todo: this will be broken in the future
      const { data }: any = await ZohoService.callApi(options);
      return data.map((attachment: any) => {
        return {
          id: attachment.id,
          fileName: attachment.File_Name,
          url: attachment["$link_url"],
        };
      });
    } catch (error) {
      throw new Error("Failed search");
    }
  }

  static async updateLead(id: string, data: any) {
    const options = {
      method: "PUT",
      url: ZohoService.lead_url + id,
      headers: {
        Authorization: "Bearer " + ZohoService.access_token,
      },
      data,
    };

    const {
      details: { id: newId },
    }: any = await ZohoService.callApi(options);
    return newId;
  }

  static async newLead(data: any) {
    const options = {
      method: "POST",
      url: ZohoService.lead_url.slice(0, -1),
      headers: {
        Authorization: "Bearer " + ZohoService.access_token,
      },
      data,
    };

    const {
      details: { id: newId },
    }: any = await ZohoService.callApi(options);
    if (!newId) {
      throw new Error("Failed creating new Zoho lead");
    }
    return newId;
  }

  static async attach(data: TLeadRaw, url: string): Promise<any> {
    const formData = new FormData();
    formData.append("attachmentUrl", url + "&created=" + +new Date());
    const formHeaders = formData.getHeaders();
    var options = {
      method: "POST",
      url: ZohoService.lead_url + data.id + "/Attachments",
      headers: {
        ...formHeaders,
        Authorization: "Bearer " + ZohoService.access_token,
      },
      data: formData,
    };

    const {
      details: { id: newId },
    }: any = await ZohoService.callApi(options);
    return newId;
  }

  static async refreshToken(): Promise<string> {
    const options = {
      method: "POST",
      url: "https://accounts.zoho.com/oauth/v2/token",
      params: {
        grant_type: "refresh_token",
        refresh_token: ZohoService.refresh_token,
        client_id: ZohoService.client_id,
        client_secret: ZohoService.client_secret,
      },
    };

    const {
      data: { access_token },
    } = await ZohoService.executeCall(options);
    return access_token;
  }

  static async callApi(options: any) {
    ZohoService.access_token = await ZohoService.refreshToken();
    const authHeader = "Bearer " + ZohoService.access_token;
    const response = await ZohoService.executeCall({ ...options, headers: { ...options.headers,  Authorization: authHeader }});
    return deriveZohoResponse(response)
  }

  static async executeCall(options: any) {
    return axios(options).catch((error) => {
        console.log('[zoho]: executeCall err ->', error)
        return error;
    });
  }
}

const deriveZohoResponse = (response: any) => {
  if (response && response.data && response.data.data[0]) {
    return response.data.data[0];
  } else if (response && response.response && response.response.data && response.response.data.data[0]) {
    return response.response.data.data[0];
  } else if (response && response.response && response.response.data[0]) {
    return response.response.data[0];
  } else if (response && response.data) {
    return response.data
  } else {
    return response
  }
}

export default ZohoService;
