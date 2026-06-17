import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RosterCategory, RosterPerson } from '../callsheets/callsheet.types';
import { RosterPersonEntity } from './entities/roster-person.entity';

const supportedCategories: RosterCategory[] = ['cast', 'crew', 'emergency', 'other'];

@Injectable()
export class RosterService {
  constructor(
    @InjectRepository(RosterPersonEntity)
    private readonly rosterRepo: Repository<RosterPersonEntity>,
  ) {}

  private normalizeCategory(category: unknown): RosterCategory {
    return typeof category === 'string' && supportedCategories.includes(category as RosterCategory)
      ? (category as RosterCategory)
      : 'other';
  }

  private normalizePerson(id: string, payload?: Partial<RosterPerson>): RosterPerson {
    return {
      id,
      name: payload?.name?.trim() || '',
      category: this.normalizeCategory(payload?.category),
      roleOrDepartment: payload?.roleOrDepartment || '',
      email: payload?.email || '',
      phone: payload?.phone || '',
      notes: payload?.notes || '',
      active: payload?.active !== false,
    };
  }

  private entityToPerson(entity: RosterPersonEntity): RosterPerson {
    return this.normalizePerson(entity.id, {
      name: entity.name,
      category: this.normalizeCategory(entity.category),
      roleOrDepartment: entity.roleOrDepartment,
      email: entity.email,
      phone: entity.phone,
      notes: entity.notes,
      active: entity.active,
    });
  }

  async list(_userID: number) {
    const rows = await this.rosterRepo.find({
      order: { active: 'DESC', name: 'ASC' },
    });

    return {
      items: rows.map((row) => this.entityToPerson(row)),
      total: rows.length,
    };
  }

  async create(userID: number, payload?: Partial<RosterPerson>) {
    const id = payload?.id?.trim() || `person-${randomUUID().slice(0, 8)}`;
    const person = this.normalizePerson(id, payload);

    const row = this.rosterRepo.create({
      ...person,
      CreatedByUserID: userID,
    });

    const saved = await this.rosterRepo.save(row);
    return this.entityToPerson(saved);
  }

  async update(_userID: number, id: string, payload: Partial<RosterPerson>) {
    const existing = await this.rosterRepo.findOne({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Roster person not found');
    }

    const merged = this.normalizePerson(id, {
      ...this.entityToPerson(existing),
      ...payload,
      id,
    });

    existing.name = merged.name;
    existing.category = merged.category;
    existing.roleOrDepartment = merged.roleOrDepartment;
    existing.email = merged.email;
    existing.phone = merged.phone;
    existing.notes = merged.notes;
    existing.active = merged.active;

    const saved = await this.rosterRepo.save(existing);
    return this.entityToPerson(saved);
  }

  async remove(_userID: number, id: string) {
    const existing = await this.rosterRepo.findOne({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Roster person not found');
    }

    await this.rosterRepo.remove(existing);
    return { ok: true, id };
  }
}
