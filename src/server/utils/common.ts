import {UserRole} from "@workquest/database-models/lib/models/user/User";

export function  getDefaultAdditionalInfo(role: UserRole) {
  let additionalInfo: object = {
    description: null,
    secondMobileNumber: null,
    address: null,
    socialNetwork: {
      instagram: null,
      twitter: null,
      linkedin: null,
      facebook: null
    }
  };

  if (role === UserRole.Worker) {
    additionalInfo = {
      ...additionalInfo,
      skills: [],
      educations: [],
      workExperiences: []
    };
  } else if (role === UserRole.Employer) {
    additionalInfo = {
      ...additionalInfo,
      company: null,
      CEO: null,
      website: null
    };
  }

  return additionalInfo;
}
