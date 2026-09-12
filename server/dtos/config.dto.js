class ConfigDto {
  static validateUpdate(data) {
    const allowed = [
      'jdFreeLimit', 'jdPaidPackSize', 'jdPackPricePaise',
      'jdFeatureEnabled', 'freeOfferEnabled', 'freeOfferDueDate',
      'premiumServicePricePaise', 'rank1OfferPricePaise'
    ];
    const update = {};
    for (const key of allowed) {
      if (data[key] !== undefined) update[key] = data[key];
    }
    return update;
  }
}

module.exports = ConfigDto;
