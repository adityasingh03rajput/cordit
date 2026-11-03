import Joi from 'joi';

export const login = Joi.object({
  username: Joi.alternatives()
    .try(
      Joi.string().min(1).max(50),
      Joi.number().integer().positive(),
    )
    .required(),
  password: Joi.string().required().min(6).max(100),
});

export const register = Joi.object({
  username: Joi.string().optional().allow('').min(2).max(30),
  password: Joi.string().required().min(6).max(100),
  gender: Joi.string().valid('male', 'female', 'other').default('other'),
  genderPreference: Joi.string().valid('male', 'female', 'any').default('any'),
  inviteCode: Joi.string().optional().allow('').length(8),
  ageConfirmed: Joi.boolean().optional(),
});

export const updateProfile = Joi.object({
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  genderPreference: Joi.string().valid('male', 'female', 'any').optional(),
});
