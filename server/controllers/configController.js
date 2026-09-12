const configService = require('../services/config.service');
const ConfigDto = require('../dtos/config.dto');

const getAdminConfig = async (req, res, next) => {
  try {
    const config = await configService.getAdminConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateAdminConfig = async (req, res, next) => {
  try {
    const updateData = ConfigDto.validateUpdate(req.body);
    const fresh = await configService.updateAdminConfig(updateData);
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAdminConfig, updateAdminConfig };
