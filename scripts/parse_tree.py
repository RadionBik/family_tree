import argparse
import json
import pathlib
import xml.etree.ElementTree as ET

try:
    from bs4 import BeautifulSoup
except ImportError:
    print(
        "BeautifulSoup is not installed. Please install it using: pip install beautifulsoup4"
    )
    exit(1)


def xmlToDict(xml_element, debug=False):
    output = []
    for elem in xml_element.findall("node"):
        person_data = {}

        person_data["id"] = elem.get("ID")

        rich_content_element = elem.find("richcontent")
        if rich_content_element is not None:
            html_content = rich_content_element.text
            if html_content:
                soup = BeautifulSoup(html_content, "html.parser")
                text_parts = [
                    tag.get_text(strip=True)
                    for tag in soup.find_all(["p", "b"])
                    if tag.get_text(strip=True)
                ]
                person_data["name"] = ", ".join(text_parts).replace("\n", " ").strip()
            else:
                person_data["name"] = (
                    elem.get("TEXT", "").replace("&#10;", "\n").strip()
                )
        else:
            person_data["name"] = elem.get("TEXT", "").replace("&#10;", "\n").strip()

        if person_data.get("name"):
            person_data["name"] = person_data["name"].lstrip("0123456789. ").strip()

        children = xmlToDict(elem, debug)
        if children:
            person_data["children"] = children
            person_data["type"] = "branch"
        else:
            person_data["children"] = []
            person_data["type"] = "leaf"

        output.append(person_data)

    return output


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True, help="Path to the XML Freeplane file.")
    ap.add_argument(
        "--output",
        help="Output JSON file path. Defaults to input filename with .json extension.",
    )
    ap.add_argument("--debug", action="store_true", help="Enable debug output.")
    args = ap.parse_args()

    file_path = pathlib.Path(args.file)

    if not file_path.exists():
        print(f"Error: File not found at {file_path}")
        exit(1)

    raw_xml = ""
    try:
        with open(file_path, encoding="utf-8") as fp:
            raw_xml = fp.read()
    except Exception as e:
        print(f"File IO Error: {e}")
        exit(1)

    root_element = ET.fromstring(raw_xml)

    mind_map_roots = []
    for node in root_element.findall("node"):
        if "LOCALIZED_TEXT" not in node.attrib:
            mind_map_roots.append(node)

    if not mind_map_roots:
        print("Error: Could not find any main family tree root nodes in the XML.")
        exit(1)

    mind_map_json = []
    for root_node in mind_map_roots:
        parsed_node = xmlToDict(root_node, args.debug)
        if parsed_node:
            mind_map_json.extend(parsed_node)

    output_file_path = (
        pathlib.Path(args.output) if args.output else file_path.with_suffix(".json")
    )
    try:
        with open(output_file_path, "w", encoding="utf-8") as f:
            json.dump(mind_map_json, f, ensure_ascii=False, indent=2)
        print(f"Successfully parsed '{file_path}' to '{output_file_path}'")
    except Exception as e:
        print(f"Error writing JSON output: {e}")
        exit(1)


if __name__ == "__main__":
    main()
