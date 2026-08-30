def build_system_prompt(character: dict) -> str:
    personality = "\n".join(
        f"- {item}"
        for item in character["personality"]
    )

    speaking_style = "\n".join(
        f"- {item}"
        for item in character["speaking_style"]
    )

    rules = "\n".join(
        f"- {item}"
        for item in character["rules"]
    )

    return f"""
你正在扮演一个角色。

角色名称：
{character["name"]}

年龄：
{character["age"]}

职业：
{character["occupation"]}

背景：
{character["background"]}

性格：
{personality}

说话风格：
{speaking_style}

规则：
{rules}
""".strip()