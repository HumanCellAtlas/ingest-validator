import flatten_json
import requests
from functools import reduce
from common.criticalvalidationexception import CriticalValidationException
from common.skipvalidationexception import SkipValidationException

class OntologyValidationUtil:
    '''
    Given a metadata_document dictionary(i.e JSON document), returns a list of pairs/2-tuples: the first
    element of the pair is a (pseudo)JSONPaths to an ontology term in the document and the second element of
    is the ontology term itself.
    e.g
    given a document...

    {
        "xxx": {
            "yyy": {
                "ontology" : "ABC0001234"
            },
            "zzz" : {
                "aaa" : {
                    "ontology" : "ABC999444"
                }
            }
        }
    }

    ...returns the list of pairs [("xxx.yyy.ontology", "ABC0001234"),("xxx.zzz.aaa.ontology", "ABC999444")]

    '''
    def find_ontology_terms_in_document(self, metadata_document: dict):
        return [item for item in flatten_json.flatten(metadata_document, ".").items() if item[0].endswith(".ontology")]

    '''
    given a string of form xxx.yyy.zzzzz.ontology, returns zzzzz_ontology.json 
    '''
    def get_ontology_schema_file_name_from_ontology_field(self, ontology_field_path: str):
        split_ontology_field_path = ontology_field_path.split(".")
        if split_ontology_field_path[-1] != "ontology":
            raise("Error: " + ontology_field_path + "does not specify a valid ontology field")
        else:
            return split_ontology_field_path[-2] + "_" + "ontology" + ".json"

    '''
    fetches an ontology schema at the specified location
    '''
    def retrieve_ontology_schema(self, base_url, filename):
        retrieve_schema_request = requests.get(base_url + "/" + filename)
        if retrieve_schema_request.status_code == 200:
            return retrieve_schema_request.json()
        else:
            raise SkipValidationException("couldn't find a matching schema for this ontology term, skipping validation...")

    '''
    generates an OLS query dict() given the ontology schema describing graph restrictions and ontology term
    '''
    def generate_ols_query(self, ontology_schema: dict, ontology_term: str):
        try:
            graph_restrictions = ontology_schema["properties"]["ontology"]["graph_restriction"]
            # given the list ["obo:uberon", "obo:efo"], returns the list ["uberon", "ufo"]
            ontologies_to_query = [ontology.split(":")[1] for ontology in graph_restrictions["ontologies"]]
            # given the list ["uberon", "ufo", "ontologyX", "ontologyY"], returns the string "uberon,ufo,ontologyX,ontologyY"
            ontologies_to_query_string = reduce(lambda ontology, another_ontology: ontology + "," + another_ontology, ontologies_to_query)
            ontology_classes_to_query = [ontology_class.replace(":", "_") for ontology_class in graph_restrictions["classes"]]
            ontology_classes_uris = [self.get_iri_for_ontology_class(ontology_class) for ontology_class in ontology_classes_to_query]

            query_dict = dict()
            query_dict["q"] = ontology_term
            query_dict["queryFields"] = "short_form,obo_id"
            query_dict["ontology"] = ontologies_to_query_string
            query_dict["allChildrenOf"] = reduce(lambda ontology_class_iri, another_ontology_class_iri: ontology_class_iri + "," + another_ontology_class_iri, ontology_classes_uris)
            return query_dict
        except KeyError as e:
            raise CriticalValidationException("Critical error: Failed to parse ontology schema: " + str(e))

    def get_iri_for_ontology_class(self, ontology_class):
        iri_lookup_request = requests.get("https://www.ebi.ac.uk/ols/api/terms", {"id":ontology_class})
        try:
            return iri_lookup_request.json()["_embedded"]["terms"][0]["iri"]
        except KeyError as e:
            raise CriticalValidationException(("Critical error: Could not find ontology class {} in OLS using lookup query {}".format(ontology_class, iri_lookup_request.url)))


    '''
    searches OLS with the given query and handles the response. returns the response
    retries lookup in case of non-2XX response
    '''
    def lookup_ontology_term(self, lookup_query_dict):
        retries = 0
        max_retries = 5
        while retries < 5:
            lookup_response = requests.get("https://www.ebi.ac.uk/ols/api/search", params=lookup_query_dict)
            if not 200 <= lookup_response.status_code <= 300:
                retries += 1
                if retries == max_retries:
                    raise CriticalValidationException("Failed to look up ontology class in OLS using query {}. Status code {}".format(lookup_response.url, str(lookup_response.status_code)))
            else:
                return lookup_response

