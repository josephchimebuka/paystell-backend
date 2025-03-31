import { Merchant } from "../interfaces/webhook.interfaces";
import { Repository } from "typeorm";
import { validate } from "class-validator";
import { MerchantEntity } from "../entities/Merchant.entity";
import AppDataSource from "../config/db";
import { CreateMerchantDTO } from "../../src/dtos/CreateMerchantDTO";
import { UpdateMerchantProfileDTO } from "../../src/dtos/UpdateMerchantProfileDTO";
import { CreateMerchantProfileDTO } from "../../src/dtos/CreateMerchantProfileDTO";
import { FileUploadService } from "./fileUpload.service";

export class MerchantAuthService {
  private merchantRepository: Repository<MerchantEntity>;

  constructor() {
    this.merchantRepository = AppDataSource.getRepository(MerchantEntity);
  }

  async register(merchantData: CreateMerchantDTO): Promise<Merchant> {
    const dto = Object.assign(new CreateMerchantDTO(), merchantData);
    const errors = await validate(dto);
    
    if (errors.length > 0) {
      throw new Error(
        errors.map((err) => Object.values(err.constraints || {})).join(", "),
      );
    }

    const merchantExists = await this.merchantRepository.findOne({
      where: { email: merchantData.email },
    });

    if (merchantExists) {
      throw new Error("Email already registered");
    }

    const merchant = this.merchantRepository.create(merchantData);
    const savedMerchant = await this.merchantRepository.save(merchant);

    return savedMerchant;
  }

  private async findMerchantByApiKey(apiKey: string): Promise<Merchant | null> {
    try {
      const merchant = await this.merchantRepository.findOne({
        where: { apiKey },
      });

      if (!merchant) {
        throw new Error("Merchant not found");
      }

      return merchant;
    } catch (err) {
      console.error("Error finding merchant by api key", err);
      return null;
    }
  }

  async getMerchantById(id: string): Promise<Merchant | null> {
    try {
      const merchant = await this.merchantRepository.findOne({
        where: { id },
      });

      if (!merchant || !merchant.isActive) {
        throw new Error(`Merchant ${merchant ? "is not active" : "not found"}`);
      }

      return merchant;
    } catch (err) {
      throw new Error(`Error in finding merchant: ${err}`);
    }
  }

  async validateApiKey(apiKey: string): Promise<Merchant | null> {
    if (!apiKey) {
      throw new Error("API key is required");
    }

    const merchant = await this.findMerchantByApiKey(apiKey);

    if (!merchant || !merchant.isActive) {
      throw new Error(
        `Merchant ${merchant ? "is not active" : "does not exist"}`,
      );
    }

    return merchant;
  }
  
  async getBusinessProfileById(id: string): Promise<Partial<Merchant>> {
    const merchant = await this.merchantRepository.findOne({
      where: { id },
    });

    if (!merchant) {
      throw new Error("Merchant not found");
    }

    return {
      business_name: merchant.business_name,
      business_email: merchant.business_email,
      business_description: merchant.business_description,
      business_address: merchant.business_address,
      business_phone: merchant.business_phone,
      business_logo_url: merchant.business_logo_url,
    };

  }

  async createMerchantProfile(merchantId: string, profileData: CreateMerchantProfileDTO): Promise<Merchant> {
    const dto = Object.assign(new CreateMerchantProfileDTO(), profileData);
    const errors = await validate(dto);
    
    if (errors.length > 0) {
      throw new Error(
        errors.map((err) => Object.values(err.constraints || {})).join(", "),
      );
    }

    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const updatedMerchant = this.merchantRepository.merge(merchant, profileData);
    return this.merchantRepository.save(updatedMerchant);

  }

  async updateMerchantProfile(merchantId: string, profileData: UpdateMerchantProfileDTO): Promise<Merchant> {
    const dto = Object.assign(new UpdateMerchantProfileDTO(), profileData);
    const errors = await validate(dto);
    
    if (errors.length > 0) {
      throw new Error(
        errors.map((err) => Object.values(err.constraints || {})).join(", "),
      );
    }

    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const updatedMerchant = this.merchantRepository.merge(merchant, profileData);
    return this.merchantRepository.save(updatedMerchant);
  }

  async updateLogo(merchantId: string, logoUrl: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    merchant.business_logo_url = logoUrl;
    return this.merchantRepository.save(merchant);
  }

  async deleteLogo(merchantId: string): Promise<Merchant> {
    const fileUploadService = new FileUploadService();
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }
    const fileUrl = merchant.business_logo_url;
    if (fileUrl) {
      await fileUploadService.deleteFile(fileUrl);
    }
    merchant.business_logo_url = '';
    return this.merchantRepository.save(merchant);
  }
}
