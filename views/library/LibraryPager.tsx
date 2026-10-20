import Icon from "../../components/Icon";

type Props = { page: number; pages: number; onPage: (page: number) => void };
export default function LibraryPager({ page, pages, onPage }: Props) {
  return (
    <nav className="library-pager" aria-label="Library pages">
      <button
        className="button secondary pager-prev"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        <Icon name="arrow" size={18} />
        <span className="pager-label">Previous</span>
      </button>
      <ol>
        {Array.from({ length: pages }, (_, index) => index + 1).map(
          (number) => (
            <li key={number}>
              <button
                className="pager-page"
                aria-label={`Page ${number}`}
                aria-current={number === page ? "page" : undefined}
                onClick={() => onPage(number)}
              >
                {number}
              </button>
            </li>
          ),
        )}
      </ol>
      <button
        className="button secondary"
        aria-label="Next page"
        disabled={page === pages}
        onClick={() => onPage(page + 1)}
      >
        <span className="pager-label">Next</span>
        <Icon name="arrow" size={18} />
      </button>
    </nav>
  );
}
