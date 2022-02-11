import { output } from '../../utils';
import { SkillsFiltersController } from '../../controllers/controller.skillsFilters';

export async function getFilters(r) {
  const skillsFiltersController = await SkillsFiltersController.getInstance();

  return output(skillsFiltersController.mapIndustryAndSpecialization);
}
