import {SpecializationFilter} from "@workquest/database-models/lib/models";
import {error} from "../utils";
import {Errors} from "../utils/errors";

export type MapSpecialization = { [specialization: string]: string };
export type MapIndustry = { [industry: string]: MapSpecialization }
export type MapIndustryAndSpecialization = { [industryWithSpecialization: string]: string };

export type ModelRecord = {
  path: string;
  industryKey: string;
  specializationKey: string;
  [alias: string]: string;
}

abstract class SkillsFiltersHelper {

  protected mapSpecializations: MapIndustry | MapIndustryAndSpecialization;
  protected mapSpecializationsForGet: { [industry: string]: { id: number, skills: MapSpecialization } }

  public get mapIndustryAndSpecialization() { return this.mapSpecializationsForGet }

  protected constructor(
    protected specializationFilters: SpecializationFilter[]
  ) {
    this.mapSpecializations = {};
    this.mapSpecializationsForGet = {};

    this.initMap();
  }

  private initMap() {
    this.specializationFilters.forEach(s => {
      if (!this.mapSpecializations[s.industryKey]) {
        this.mapSpecializations[s.industryKey] = { };
      }

      this.mapSpecializations[s.industryKey][s.key] = s.specialization;
      this.mapSpecializations[`${s.industryKey}.${s.key}`] = s.specialization;

      if (!this.mapSpecializationsForGet[s.industryFilter.industry]) {
        this.mapSpecializationsForGet[s.industryFilter.industry] = { id: s.industryKey, skills: { } }
      }

      this.mapSpecializationsForGet[s.industryFilter.industry]['skills'][s.specialization] = s.key;
    });
  }

  public checkIndustryAndSpecializationKeyPair(pair: string /** Sample: "1.500" */) {
    if (!this.mapSpecializations[pair]) {
      throw error(Errors.NotFound, "Keys pair path in specialization filters not found", {
        keysPair: pair,
      });
    }
  }

  /**
   * @param keys as ["1.100", "1.101", ...]
   * @param alias id (uid) user or quest
   * @param aliasValue value of user or quest id
   */
  public keysToRecords(keys: string[], alias: 'questId' | 'userId', aliasValue: string): ModelRecord[] {
    const records: ModelRecord[] = [];

    for (const keysPair of keys) {
      const [industryKey, specializationKey] = keysPair.split(/\./) as [string, string];

      this.checkIndustryAndSpecializationKeyPair(keysPair)

      records.push({
        path: keysPair,
        industryKey,
        specializationKey,
        [alias]: aliasValue,
      });
    }

    return records;
  }

  public static splitSpecialisationAndIndustry(keys: string[]): { specializationKeys: number[], industryKeys: number[] } {
    const industryKeys = []; const specializationKeys = [];

    for (const key of keys) {
      const [industryKey, specializationKey] = key.split(/\./) as [string, string | null];

      if (specializationKey) {
        specializationKeys.push(parseInt(specializationKey));
      }

      industryKeys.push(parseInt(industryKey));
    }

    return { industryKeys, specializationKeys }
  }
}

export class SkillsFiltersController extends SkillsFiltersHelper {
  private static instance: SkillsFiltersController;

  private constructor(
    protected specializationFilters: SpecializationFilter[]
  ) {
    super(specializationFilters);
  }

  public static async getInstance(): Promise<SkillsFiltersController> {
    if (!SkillsFiltersController.instance) {
      SkillsFiltersController.instance = new SkillsFiltersController(await SpecializationFilter.findAll());
    }

    return SkillsFiltersController.instance;
  }
}
