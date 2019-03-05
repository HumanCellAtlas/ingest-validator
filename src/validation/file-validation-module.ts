import {FileResource, ValidationPlan} from "../common/types";
import Promise from "bluebird";

interface IFileValidationModule {
    isEligible(fileResource: FileResource): Promise<boolean>;
    run(fileResource: FileResource) : Promise<ValidationPlan[]>;
}

export default IFileValidationModule;