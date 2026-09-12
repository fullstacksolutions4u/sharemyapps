class PlanDto {
  static validateCreate(data) {
    const { name, price, description, features } = data;
    if (!name || price == null) {
      const err = new Error('Name and price are required'); err.status = 400; throw err;
    }
    return data;
  }

  static validateUpdate(data) {
    return data;
  }
}

module.exports = PlanDto;
