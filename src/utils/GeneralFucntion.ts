class GeneralFunction {
  static formatVNPhone = (phone: string) => {
    if (phone.startsWith("0")) {
      return "+84" + phone.slice(1);
    }
    return phone;
  };
}

export default GeneralFunction;
