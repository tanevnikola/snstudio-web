import jsYaml from 'js-yaml';
import { isCollectionInjection, isDelegating, isMapInjection } from "./parameterSpecUtils";
import { isImplementing, isResourceInjector } from './mnemoUtils';

export function dumpYamlAsText(yaml) {
    return yaml ? jsYaml.dump(yaml, { lineWidth: -1, noRefs: true }) : ''
}

export function extractParameterYaml(yaml, parameterSpec) {
    const parameterYaml = isDelegating(parameterSpec) 
        ? yaml
        : yaml?.[parameterSpec?.name];
        
    if (parameterYaml == null) {
        if (isCollectionInjection(parameterSpec)) {
            return [];
        }
        if (isMapInjection(parameterSpec)) {
            return {};
        }
        return  { t: parameterSpec.mnemonic };
    }

    return normalizeParameterValue(parameterYaml, parameterSpec);
}

export function normalizeParameterValue(parameterYaml, parameterSpec) {
    if (isMapInjection(parameterSpec) || isCollectionInjection(parameterSpec)) {
        return parameterYaml;
    }

    if (parameterYaml?.t == null) {
        return { t: parameterSpec.mnemonic, v: parameterYaml ?? null };
    }
    return parameterYaml;
}

export function extractTaskYaml(functionYaml) {
    return functionYaml?.task ?? (
        functionYaml?.tasks 
            ? { t: 'Task.Chain', v: functionYaml.tasks } 
            : null);
}

export function extractTaskMnemonic(taskYaml) {
    return taskYaml?.t ?? null;
}

export function getPrimitiveValue(primitiveYaml, parameterSpec) {
    if (primitiveYaml.v == null) {
        return parameterSpec.defaultValue;
    }
    return primitiveYaml.v;
}