export function isExternal(href: string): boolean {
    return /^https?:\/\//.test(href);
}

/** 判斷導覽項目是否對應目前頁面（子頁面也算，例如 /articles/xxx 對應 /articles） */
export function isActive(href: string, pathname: string): boolean {
    if (isExternal(href)) return false;
    const current = pathname.replace(/\/$/, "") || "/";
    const target = href.replace(/\/$/, "") || "/";
    return target === "/" ? current === "/" : current === target || current.startsWith(target + "/");
}

/** 外部連結以新分頁開啟 */
export function linkAttrs(href: string) {
    return isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
