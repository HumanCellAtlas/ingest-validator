class CustomAjvError {
  keyword: string;
  message: string;
  params: any;

  constructor(keyword: string, message: string, paramsObj: any) {
    this.keyword = keyword;
    this.message = message;
    this.params = paramsObj;
  }
}

export default CustomAjvError;